import cv2
import numpy as np
from ultralytics import YOLO
from playsound import playsound
import threading
import os
import time

# ... (rest of your existing imports and constants) ...

# Load YOLOv8n model (nano, fastest)
model = YOLO('yolov8n.pt')

# Classes of interest (COCO names)
TARGET_CLASSES = [
    'car', 'person', 'couch', 'chair', 'bed', 'dining table', 'tv'
]

# Average real-world heights in centimeters (adjust as needed)
REAL_HEIGHTS = {
    'person': 170,
    'car': 150,
    'couch': 90,
    'chair': 100,
    'bed': 60,
    'dining table': 75,
    'tv': 60  # TV height, but we'll use width for distance
}
# Average real-world widths in centimeters for TVs (for more accurate TV distance)
REAL_WIDTHS = {
    'tv': 100  # average TV width in cm
}

# Estimated focal length in pixels (adjust for your camera)
# NOTE: For best results, calibrate this value for your specific camera and setup.
FOCAL_LENGTH = 600

# Motion thresholds (pixels per frame) for defining 'static', 'slow', 'fast'
STATIC_THRESH = 30
SLOW_THRESH = 80

# --- Sound Setup ---
SOUND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sound_handle', 'sound_profiles', 'default')
FAST_SOUND = os.path.join(SOUND_DIR, 'fast.wav')
SLOW_SOUND = os.path.join(SOUND_DIR, 'slow.wav')
STATIC_SOUND = os.path.join(SOUND_DIR, 'static.wav')

# Verify that sound files exist - ADDED MORE VERBOSE PRINTOUT
print(f"DEBUG: Checking sound directory: {SOUND_DIR}")
for sound_file in [FAST_SOUND, SLOW_SOUND, STATIC_SOUND]:
    if not os.path.exists(sound_file):
        print(f"ERROR: Sound file NOT FOUND: {sound_file}")
        print(f"Please ensure the directory '{SOUND_DIR}' contains fast.wav, slow.wav, static.wav")
        exit()
    else:
        print(f"DEBUG: Sound file found: {sound_file}")


# Sound control variables
last_sound_play_time = time.time()
SOUND_COOLDOWN_SEC = 2.0

# Simple centroid-based tracker (no changes needed here for sound debugging)
class CentroidTracker:
    def __init__(self, max_distance=50):
        self.next_object_id = 0
        self.objects = dict()
        self.max_distance = max_distance

    def update(self, detections):
        if len(detections) == 0:
            self.objects = {}
            return []

        matched_or_new_objects = []
        used_detection_indices = set()
        matched_existing_object_ids = set()

        for obj_id, existing_center in list(self.objects.items()):
            min_dist = self.max_distance + 1
            best_det_idx = -1

            for i, new_det_center in enumerate(detections):
                if i not in used_detection_indices:
                    dist = np.linalg.norm(np.array(new_det_center) - np.array(existing_center))
                    if dist < min_dist:
                        min_dist = dist
                        best_det_idx = i
            
            if best_det_idx != -1 and min_dist <= self.max_distance:
                new_det_center = detections[best_det_idx]
                self.objects[obj_id] = new_det_center
                matched_or_new_objects.append((obj_id, new_det_center))
                used_detection_indices.add(best_det_idx)
                matched_existing_object_ids.add(obj_id)
        
        for i in range(len(detections)):
            if i not in used_detection_indices:
                new_det_center = detections[i]
                self.objects[self.next_object_id] = new_det_center
                matched_or_new_objects.append((self.next_object_id, new_det_center))
                self.next_object_id += 1
        
        self.objects = {oid: self.objects[oid] for oid in self.objects if oid in {item[0] for item in matched_or_new_objects}}
        
        return matched_or_new_objects

# Open the default camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print('Error: Could not open camera.')
    exit()

tracker = CentroidTracker()
prev_positions = dict()
prev_gray = None
camera_motion = np.array([0, 0], dtype=np.float32)
current_dominant_motion = None

# Function to play sound in a separate thread - ADDED DEBUG PRINTING
def play_sound_async(sound_file):
    print(f"DEBUG: Attempting to play sound: {sound_file}") # Debug print
    try:
        playsound(sound_file, block=False)
        print(f"DEBUG: Successfully triggered playsound for: {os.path.basename(sound_file)}") # Debug print
    except Exception as e:
        print(f"ERROR: Failed to play sound {sound_file}: {e}") # Crucial error print


while True:
    ret, frame = cap.read()
    if not ret:
        print('Error: Failed to capture frame')
        break

    frame_resized = cv2.resize(frame, (1280, 720))
    img_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)

    # --- Camera motion estimation (ORB) ---
    if prev_gray is not None:
        orb = cv2.ORB_create(nfeatures=500)
        kp1, des1 = orb.detectAndCompute(prev_gray, None)
        kp2, des2 = orb.detectAndCompute(gray, None)

        if des1 is not None and des2 is not None and len(kp1) >= 10 and len(kp2) >= 10:
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
            matches = bf.knnMatch(des1, des2, k=2)
            
            good_matches = []
            for m, n in matches:
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

            if len(good_matches) > 10:
                src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
                dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
                
                M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

                if M is not None and M.shape == (3, 3):
                    camera_motion = np.array([M[0, 2], M[1, 2]], dtype=np.float32)
                else:
                    camera_motion = np.array([0, 0], dtype=np.float32)
            else:
                camera_motion = np.array([0, 0], dtype=np.float32)
        else:
            camera_motion = np.array([0, 0], dtype=np.float32)
    prev_gray = gray

    results = model(img_rgb, verbose=False)

    raw_detections_info = []
    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        class_name = model.model.names[cls_id]
        if class_name in TARGET_CLASSES:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            x_center = (x1 + x2) // 2
            y_center = (y1 + y2) // 2
            raw_detections_info.append(((x1, y1, x2, y2), class_name, conf, (x_center, y_center)))

    current_frame_centers = [info[3] for info in raw_detections_info]
    tracked_objects_output = tracker.update(current_frame_centers)
    center_to_raw_info = {info[3]: (info[0], info[1], info[2]) for info in raw_detections_info}

    frame_dominant_motion = 'none'

    for object_id, current_tracked_center in tracked_objects_output:
        if current_tracked_center not in center_to_raw_info:
            continue

        (x1, y1, x2, y2), class_name, conf = center_to_raw_info[current_tracked_center]
        x_center, y_center = current_tracked_center
        
        compensated_x = x_center - camera_motion[0]
        compensated_y = y_center - camera_motion[1]
        compensated_center = np.array([compensated_x, compensated_y], dtype=np.float32)

        prev = prev_positions.get(object_id)
        
        motion = 'static'
        if prev is not None:
            speed = np.linalg.norm(compensated_center - prev)
            if speed > SLOW_THRESH:
                motion = 'fast'
            elif speed > STATIC_THRESH:
                motion = 'slow'
            else:
                motion = 'static'
        
        prev_positions[object_id] = compensated_center

        if motion == 'fast':
            frame_dominant_motion = 'fast'
        elif motion == 'slow' and frame_dominant_motion != 'fast':
            frame_dominant_motion = 'slow'
        elif motion == 'static' and frame_dominant_motion == 'none':
            frame_dominant_motion = 'static'

        pixel_size = 0
        real_size = 0
        if class_name == 'tv':
            pixel_size = x2 - x1
            real_size = REAL_WIDTHS.get('tv', 100)
        else:
            pixel_size = y2 - y1
            real_size = REAL_HEIGHTS.get(class_name, 100)
        
        distance_m = -1.0
        if pixel_size > 0:
            distance_m = (real_size * FOCAL_LENGTH) / (pixel_size * 100.0)
        
        label = f'{class_name} {motion} ID:{object_id} {distance_m:.1f}m'
        color = (0, 255, 0) if motion == 'static' else (0, 255, 255) if motion == 'slow' else (0, 0, 255)
        cv2.rectangle(frame_resized, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame_resized, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    current_tracked_ids = {oid for oid, _ in tracked_objects_output}
    prev_positions = {oid: pos for oid, pos in prev_positions.items() if oid in current_tracked_ids}

    # --- Sound Playback Logic (with more DEBUG prints) ---
    current_time = time.time()
    sound_to_play = None

    if frame_dominant_motion == 'fast':
        sound_to_play = FAST_SOUND
    elif frame_dominant_motion == 'slow':
        sound_to_play = SLOW_SOUND
    elif frame_dominant_motion == 'static':
        sound_to_play = STATIC_SOUND
    
    should_play_sound = False
    
    # Debug prints for sound logic
    print(f"\nDEBUG SOUND LOGIC:")
    print(f"  Frame Dominant Motion: {frame_dominant_motion}")
    print(f"  Current Dominant Motion (last played): {current_dominant_motion}")
    print(f"  Objects Detected: {len(tracked_objects_output) > 0}")
    print(f"  Time since last sound: {current_time - last_sound_play_time:.2f}s (Cooldown: {SOUND_COOLDOWN_SEC}s)")

    if frame_dominant_motion != current_dominant_motion and tracked_objects_output:
        should_play_sound = True
        print("  Condition met: Motion state changed and objects detected.")
    elif current_time - last_sound_play_time >= SOUND_COOLDOWN_SEC and tracked_objects_output:
        should_play_sound = True
        print("  Condition met: Cooldown passed and objects detected.")
    
    if not tracked_objects_output:
        should_play_sound = False
        if current_dominant_motion != 'none': # Only reset if not already 'none'
            print(f"  Resetting dominant motion to 'none' (no objects detected).")
            current_dominant_motion = 'none'

    print(f"  Final should_play_sound: {should_play_sound}")
    print(f"  Sound file chosen: {os.path.basename(sound_to_play) if sound_to_play else 'None'}")

    if should_play_sound and sound_to_play:
        sound_thread = threading.Thread(target=play_sound_async, args=(sound_to_play,))
        sound_thread.start()
        last_sound_play_time = current_time
        current_dominant_motion = frame_dominant_motion
        print(f"  --- Sound Play Triggered! New dominant motion: {current_dominant_motion} ---")
    else:
        print("  --- Sound NOT Triggered this frame. ---")


    cv2.imshow('Detection & Motion', frame_resized)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()