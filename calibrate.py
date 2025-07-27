#!/usr/bin/env python3
"""
Calibration script for SoTA EarEye Detector
Run this to test and adjust your parameters
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
import threading
import sys
import select
import os

# Load YOLOv8n model
model = YOLO('yolov8n.pt')

# Test parameters - adjust these to test different values
TEST_FOCAL_LENGTH = 400
TEST_STATIC_THRESH = 15
TEST_SLOW_THRESH = 50
TEST_TRACKER_DISTANCE = 50

# Real-world sizes (same as in detector.py)
REAL_HEIGHTS = {
    'person': 170,
    'car': 150,
    'couch': 90,
    'chair': 100,
    'bed': 60,
    'dining table': 75,
    'tv': 60
}

REAL_WIDTHS = {
    'tv': 100
}

TARGET_CLASSES = ['person', 'car', 'couch', 'chair', 'bed', 'dining table', 'plant']

class SimpleTracker:
    def __init__(self, max_distance=50):
        self.next_object_id = 0
        self.objects = dict()
        self.max_distance = max_distance
        self.prev_positions = dict()

    def update(self, detections):
        if len(detections) == 0:
            self.objects = {}
            return []

        matched_or_new_objects = []
        used_detection_indices = set()

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
        
        for i in range(len(detections)):
            if i not in used_detection_indices:
                new_det_center = detections[i]
                self.objects[self.next_object_id] = new_det_center
                matched_or_new_objects.append((self.next_object_id, new_det_center))
                self.next_object_id += 1
        
        return matched_or_new_objects

def calculate_distance(class_name, pixel_size, focal_length):
    """Calculate distance using focal length formula"""
    if class_name == 'tv':
        real_size = REAL_WIDTHS.get('tv', 100)
    else:
        real_size = REAL_HEIGHTS.get(class_name, 100)
    
    if pixel_size > 0:
        distance_m = (real_size * focal_length) / (pixel_size * 100.0)
        return distance_m
    return -1.0

def terminal_input_handler():
    """Handle terminal input in a separate thread"""
    global focal_length, static_thresh, slow_thresh, tracker_distance, quit_flag
    
    print("\n=== Terminal Controls ===")
    print("Type commands and press Enter:")
    print("  focal <number>    - Set focal length (e.g., focal 400)")
    print("  static <number>   - Set static threshold (e.g., static 15)")
    print("  slow <number>     - Set slow threshold (e.g., slow 50)")
    print("  track <number>    - Set tracker distance (e.g., track 50)")
    print("  reset            - Reset object tracking")
    print("  quit             - Exit calibration")
    print("  help             - Show this help")
    print("  status           - Show current values")
    print("=" * 30)
    
    while not quit_flag:
        try:
            if select.select([sys.stdin], [], [], 0.1)[0]:
                command = input().strip().lower().split()
                if not command:
                    continue
                    
                if command[0] == 'quit':
                    quit_flag = True
                    break
                elif command[0] == 'help':
                    print("Commands: focal <num>, static <num>, slow <num>, track <num>, reset, quit, status")
                elif command[0] == 'status':
                    print(f"Current: FOCAL={focal_length}, STATIC={static_thresh}, SLOW={slow_thresh}, TRACK={tracker_distance}")
                elif command[0] == 'reset':
                    print("Reset object tracking")
                elif len(command) == 2:
                    try:
                        value = int(command[1])
                        if command[0] == 'focal':
                            focal_length = value
                            print(f"Focal length set to: {focal_length}")
                        elif command[0] == 'static':
                            static_thresh = value
                            print(f"Static threshold set to: {static_thresh}")
                        elif command[0] == 'slow':
                            slow_thresh = value
                            print(f"Slow threshold set to: {slow_thresh}")
                        elif command[0] == 'track':
                            tracker_distance = value
                            print(f"Tracker distance set to: {tracker_distance}")
                    except ValueError:
                        print("Invalid number. Use: command <number>")
                else:
                    print("Invalid command. Type 'help' for available commands.")
        except (EOFError, KeyboardInterrupt):
            quit_flag = True
            break

def main():
    global focal_length, static_thresh, slow_thresh, tracker_distance, quit_flag
    
    print("=== SoTA EarEye Calibration Tool ===")
    print(f"Current test parameters:")
    print(f"FOCAL_LENGTH: {TEST_FOCAL_LENGTH}")
    print(f"STATIC_THRESH: {TEST_STATIC_THRESH}")
    print(f"SLOW_THRESH: {TEST_SLOW_THRESH}")
    print(f"Tracker max_distance: {TEST_TRACKER_DISTANCE}")
    print("\nInstructions:")
    print("1. Stand at a known distance (e.g., 2 meters)")
    print("2. Move slowly, normally, and quickly")
    print("3. Observe the color changes and distance readings")
    print("4. Use terminal commands to adjust parameters")
    print("\nColor meanings:")
    print("Green = static, Yellow = slow, Red = fast")
    print("=" * 50)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print('Error: Could not open camera.')
        return

    tracker = SimpleTracker(TEST_TRACKER_DISTANCE)
    focal_length = TEST_FOCAL_LENGTH
    static_thresh = TEST_STATIC_THRESH
    slow_thresh = TEST_SLOW_THRESH
    tracker_distance = TEST_TRACKER_DISTANCE
    quit_flag = False

    # Start terminal input thread
    input_thread = threading.Thread(target=terminal_input_handler, daemon=True)
    input_thread.start()

    print("\nCalibration window opened. Use terminal commands to adjust parameters.")
    print("Type 'help' in terminal for available commands.")

    while not quit_flag:
        ret, frame = cap.read()
        if not ret:
            print('Error: Failed to capture frame')
            break

        frame_resized = cv2.resize(frame, (1280, 720))
        img_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)

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

        for object_id, current_tracked_center in tracked_objects_output:
            if current_tracked_center not in center_to_raw_info:
                continue

            (x1, y1, x2, y2), class_name, conf = center_to_raw_info[current_tracked_center]
            x_center, y_center = current_tracked_center

            # Calculate motion
            prev = tracker.prev_positions.get(object_id)
            motion = 'static'
            if prev is not None:
                speed = np.linalg.norm(np.array([x_center, y_center]) - prev)
                if speed > slow_thresh:
                    motion = 'fast'
                elif speed > static_thresh:
                    motion = 'slow'
                else:
                    motion = 'static'
            
            tracker.prev_positions[object_id] = np.array([x_center, y_center])

            # Calculate distance
            w = x2 - x1
            h = y2 - y1
            if class_name == 'tv':
                pixel_size = w
            else:
                pixel_size = np.sqrt(w ** 2 + h ** 2)

            distance_m = calculate_distance(class_name, pixel_size, focal_length)

            # Draw bounding box and label
            label = f'{class_name} {motion} ID:{object_id} {distance_m:.1f}m'
            color = (0, 255, 0) if motion == 'static' else (0, 255, 255) if motion == 'slow' else (0, 0, 255)
            cv2.rectangle(frame_resized, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame_resized, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # Display current parameters
        param_text = f"FOCAL: {focal_length} STATIC: {static_thresh} SLOW: {slow_thresh} TRACK: {tracker_distance}"
        cv2.putText(frame_resized, param_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Add instructions to the video window
        cv2.putText(frame_resized, "Use terminal commands to adjust parameters", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame_resized, "Type 'help' in terminal for commands", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        cv2.imshow('Calibration Tool', frame_resized)

        # Try both OpenCV keys and check for quit flag
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or quit_flag:
            break

    cap.release()
    cv2.destroyAllWindows()
    
    print("\n=== Final Parameters ===")
    print(f"FOCAL_LENGTH = {focal_length}")
    print(f"STATIC_THRESH = {static_thresh}")
    print(f"SLOW_THRESH = {slow_thresh}")
    print(f"CentroidTracker max_distance = {tracker_distance}")
    print("\nCopy these values to your detector.py file!")

if __name__ == "__main__":
    main() 