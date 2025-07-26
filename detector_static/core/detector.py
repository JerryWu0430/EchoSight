"""Core object detection and tracking functionality."""

import cv2
import numpy as np
from ultralytics import YOLO
from typing import List, Tuple, Dict

from ..config.settings import Config
from ..utils.types import TrackedObject
from ..motion.tracker import CentroidTracker

class ObjectDetector:
    """Handles object detection and tracking using YOLOv8"""
    def __init__(self, model_path: str = 'yolov8n.pt'):
        self.model = YOLO(model_path)
        self.tracker = CentroidTracker()
        
    def detect_and_track(self, frame: np.ndarray) -> Tuple[List[TrackedObject], np.ndarray]:
        """Detect objects in frame and track them"""
        # Prepare frame
        frame_resized = cv2.resize(frame, (Config.CAMERA.frame_width, Config.CAMERA.frame_height))
        img_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
        
        # Run detection
        results = self.model(img_rgb, verbose=False)
        
        # Process detections
        raw_detections_info = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            class_name = self.model.model.names[cls_id]
            
            if class_name in Config.TARGET_CLASSES:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                x_center = (x1 + x2) // 2
                y_center = (y1 + y2) // 2
                raw_detections_info.append(((x1, y1, x2, y2), class_name, conf, (x_center, y_center)))
        
        # Update tracking
        current_frame_centers = [info[3] for info in raw_detections_info]
        tracked_objects_output = self.tracker.update(current_frame_centers)
        
        # Create tracked objects
        tracked_objects: List[TrackedObject] = []
        center_to_raw_info = {info[3]: (info[0], info[1], info[2]) for info in raw_detections_info}
        
        for object_id, current_tracked_center in tracked_objects_output:
            if current_tracked_center not in center_to_raw_info:
                continue
                
            bbox, class_name, conf = center_to_raw_info[current_tracked_center]
            tracked_objects.append(TrackedObject(
                object_id=object_id,
                center=current_tracked_center,
                class_name=class_name,
                confidence=conf,
                bbox=bbox
            ))
        
        return tracked_objects, frame_resized 