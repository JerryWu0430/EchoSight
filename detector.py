import cv2
import numpy as np
from ultralytics import YOLO
import threading
import os
import time
import pygame
import math
from collections import deque
from threading import Lock

# Initialize pygame mixer with higher quality settings
pygame.mixer.pre_init(frequency=44100, size=-16, channels=2, buffer=512)
pygame.mixer.init()

class SmoothAudioEngine:
    def __init__(self, sound_dir):
        self.sound_dir = sound_dir
        self.sounds = {}
        self.channels = {}
        self.target_volumes = {}
        self.current_volumes = {}
        self.lock = Lock()
        
        # Audio parameters
        self.crossfade_time = 0.2  # 200ms crossfade
        self.volume_smoothing = 0.15  # Volume interpolation speed
        self.max_volume = 0.7
        
        # Motion state tracking
        self.current_state = 'none'
        self.state_history = deque(maxlen=5)  # Smooth state transitions
        
        # Load sounds
        self.load_sounds()
        
        # Start the audio update thread
        self.running = True
        self.audio_thread = threading.Thread(target=self._audio_update_loop, daemon=True)
        self.audio_thread.start()
    
    def load_sounds(self):
        """Load the existing sound files"""
        sound_files = {
            'fast': 'fast.mp3',
            'slow': 'slow.mp3'
        }
        
        # Set up more channels for smooth mixing
        pygame.mixer.set_num_channels(8)
        
        for sound_name, filename in sound_files.items():
            filepath = os.path.join(self.sound_dir, filename)
            if os.path.exists(filepath):
                try:
                    sound = pygame.mixer.Sound(filepath)
                    self.sounds[sound_name] = sound
                    
                    # Assign dedicated channels
                    channel_id = len(self.channels)
                    self.channels[sound_name] = pygame.mixer.Channel(channel_id)
                    
                    # Initialize volumes
                    self.current_volumes[sound_name] = 0.0
                    self.target_volumes[sound_name] = 0.0
                    
                    print(f"DEBUG: Loaded sound: {sound_name}")
                except Exception as e:
                    print(f"ERROR: Failed to load {sound_name}: {e}")
    
    def _audio_update_loop(self):
        """Continuous smooth audio processing"""
        clock = pygame.time.Clock()
        
        while self.running:
            with self.lock:
                self._update_volumes()
                self._update_playback()
            
            clock.tick(60)  # 60 FPS for smooth audio
    
    def _update_volumes(self):
        """Smooth volume interpolation using exponential easing"""
        for sound_name in self.sounds:
            current = self.current_volumes[sound_name]
            target = self.target_volumes[sound_name]
            
            if abs(current - target) > 0.01:
                # Exponential interpolation for natural fading
                diff = target - current
                self.current_volumes[sound_name] = current + diff * self.volume_smoothing
            else:
                self.current_volumes[sound_name] = target
    
    def _update_playback(self):
        """Update sound playback with smooth crossfading"""
        for sound_name, sound in self.sounds.items():
            channel = self.channels[sound_name]
            volume = self.current_volumes[sound_name]
            
            if volume > 0.01:  # Should be playing
                if not channel.get_busy():
                    # Start looping playback
                    channel.play(sound, loops=-1)
                
                # Set smooth volume
                channel.set_volume(volume)
            else:  # Should be silent
                if channel.get_busy():
                    # Smooth fadeout instead of hard stop
                    fadeout_time = int(self.crossfade_time * 1000)
                    channel.fadeout(fadeout_time)
    
    def smooth_state_transition(self, new_state):
        """Apply smoothing to state changes to prevent jitter"""
        self.state_history.append(new_state)
        
        # Use majority vote from recent history for stability
        if len(self.state_history) >= 3:
            state_counts = {}
            for state in self.state_history:
                state_counts[state] = state_counts.get(state, 0) + 1
            
            # Find most common state, prefer current if tied
            most_common = max(state_counts, key=state_counts.get)
            return most_common
        
        return new_state
    
    def update_from_motion_state(self, frame_dominant_motion, distances, has_objects):
        """Update audio based on the existing motion detection logic"""
        with self.lock:
            # Apply state smoothing
            smoothed_state = self.smooth_state_transition(frame_dominant_motion)
            
            # Reset all volumes
            for sound_name in self.target_volumes:
                self.target_volumes[sound_name] = 0.0
            
            if not has_objects:
                # No objects - fade everything out
                return
            
            # Calculate volume based on proximity
            base_volume = self.max_volume
            if distances:
                min_distance = min(distances)
                # Volume increases as objects get closer (capped at 5m)
                distance_factor = max(0.2, min(1.0, 3.0 / (min_distance + 0.5)))
                base_volume *= distance_factor
            
            # Set target volumes based on smoothed state
            if smoothed_state == 'fast':
                self.target_volumes['fast'] = base_volume
                # Layer some slow sound for richness
                self.target_volumes['slow'] = base_volume * 0.3
            elif smoothed_state == 'slow':
                self.target_volumes['slow'] = base_volume
    
    def cleanup(self):
        """Clean shutdown"""
        self.running = False
        if hasattr(self, 'audio_thread') and self.audio_thread.is_alive():
            self.audio_thread.join(timeout=1.0)


# Enhanced sound function that replaces the original
def create_smooth_audio_system(sound_dir):
    """Factory function to create the smooth audio system"""
    return SmoothAudioEngine(sound_dir)

# Modified play_sound_async function for compatibility
def play_sound_async_smooth(audio_engine, motion_state, distances, has_objects):
    """Smooth replacement for the original play_sound_async function"""
    audio_engine.update_from_motion_state(motion_state, distances, has_objects)


# Load YOLOv8n model (nano, fastest)
model = YOLO('yolov8n.pt')

# Classes of interest (COCO names)
TARGET_CLASSES = [
    'car', 'person', 'couch', 'chair', 'bed', 'dining table', 'plant'
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
FOCAL_LENGTH = 400

# Motion thresholds (pixels per frame) for defining 'static', 'slow', 'fast'
STATIC_THRESH = 15
SLOW_THRESH = 50

# --- Enhanced Sound Setup ---
SOUND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sound_handle', 'instuments')
FAST_SOUND = os.path.join(SOUND_DIR, 'fast.mp3')
SLOW_SOUND = os.path.join(SOUND_DIR, 'slow.mp3')

# Verify that sound files exist
print(f"DEBUG: Checking sound directory: {SOUND_DIR}")
for sound_file in [FAST_SOUND, SLOW_SOUND]:
    if not os.path.exists(sound_file):
        print(f"ERROR: Sound file not found: {sound_file}")
        exit()
    else:
        print(f"DEBUG: Sound file found: {sound_file}")

# Initialize the smooth audio system
audio_engine = create_smooth_audio_system(SOUND_DIR)

# Sound control variables (kept for compatibility)
last_sound_play_time = time.time()
SOUND_COOLDOWN_SEC = 0.5  # Reduced cooldown for smoother response

# Simple centroid-based tracker (unchanged)
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

# Original play_sound_async function (kept for reference but not used)
def play_sound_async(sound_file, volume=1.0):
    """
    Original function - replaced by smooth audio system
    """
    pass  # This is now handled by the smooth audio engine

try:
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
        distances = []  # Collect distances for audio engine

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
            w = x2 - x1
            h = y2 - y1

            if class_name == 'tv':
                pixel_size = w  # width-based for TV
                real_size = REAL_WIDTHS.get('tv', 100)
            else:
                pixel_size = np.sqrt(w ** 2 + h ** 2)  # use diagonal
                real_size = REAL_HEIGHTS.get(class_name, 100)

            distance_m = -1.0
            if pixel_size > 0:
                distance_m = (real_size * FOCAL_LENGTH) / (pixel_size * 100.0)
                distances.append(distance_m)
            
            label = f'{class_name} {motion} ID:{object_id} {distance_m:.1f}m'
            color = (0, 255, 0) if motion == 'static' else (0, 255, 255) if motion == 'slow' else (0, 0, 255)
            cv2.rectangle(frame_resized, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame_resized, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        current_tracked_ids = {oid for oid, _ in tracked_objects_output}
        prev_positions = {oid: pos for oid, pos in prev_positions.items() if oid in current_tracked_ids}

        # --- Enhanced Smooth Sound Playback Logic ---
        current_time = time.time()
        has_objects = bool(tracked_objects_output)
        
        # Always update the smooth audio system (it handles its own state management)
        play_sound_async_smooth(audio_engine, frame_dominant_motion, distances, has_objects)
        
        # Update timing for compatibility
        if frame_dominant_motion != current_dominant_motion and has_objects:
            last_sound_play_time = current_time
            current_dominant_motion = frame_dominant_motion
            print(f"  --- Smooth Audio Update! Motion: {current_dominant_motion} ---")
        
        if not has_objects and current_dominant_motion != 'none':
            current_dominant_motion = 'none'
            print(f"  Smooth audio fading to silence (no objects detected).")

        cv2.imshow('Detection & Motion', frame_resized)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

finally:
    # Clean shutdown
    audio_engine.cleanup()
    cap.release()
    cv2.destroyAllWindows()