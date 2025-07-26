"""Motion analysis functionality."""

import cv2
import numpy as np
from typing import Dict, List, Tuple

from ..config.settings import Config
from ..utils.types import TrackedObject

class MotionAnalyzer:
    """Analyzes motion in video frames using ORB features"""
    def __init__(self):
        self.prev_gray = None
        self.camera_motion = np.array([0, 0], dtype=np.float32)
        self.prev_positions: Dict[int, np.ndarray] = {}
        self.prev_speeds: Dict[int, float] = {}  # Store previous speeds for smoothing
        
    def estimate_camera_motion(self, gray: np.ndarray) -> np.ndarray:
        """Estimate camera motion between frames using ORB features"""
        if self.prev_gray is None:
            self.prev_gray = gray
            return np.array([0, 0], dtype=np.float32)
            
        orb = cv2.ORB_create(nfeatures=500)
        kp1, des1 = orb.detectAndCompute(self.prev_gray, None)
        kp2, des2 = orb.detectAndCompute(gray, None)
        
        camera_motion = np.array([0, 0], dtype=np.float32)
        
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
        
        self.prev_gray = gray
        self.camera_motion = camera_motion
        return camera_motion
    
    def get_smoothed_speed(self, obj_id: int, current_speed: float) -> float:
        """Apply exponential smoothing to speed measurements"""
        if obj_id not in self.prev_speeds:
            self.prev_speeds[obj_id] = current_speed
            return current_speed
            
        # Apply exponential smoothing
        smoothed_speed = (Config.MOTION.smoothing_factor * self.prev_speeds[obj_id] + 
                         (1 - Config.MOTION.smoothing_factor) * current_speed)
        
        # Update stored speed
        self.prev_speeds[obj_id] = smoothed_speed
        
        return smoothed_speed
    
    def analyze_object_motion(self, tracked_objects: List[TrackedObject]) -> Tuple[str, List[float]]:
        """Analyze motion of tracked objects and determine dominant motion type"""
        frame_dominant_motion = 'none'
        distances: List[float] = []
        
        # Clean up old speed records
        current_ids = {obj.object_id for obj in tracked_objects}
        self.prev_speeds = {oid: speed for oid, speed in self.prev_speeds.items() 
                          if oid in current_ids}
        
        for obj in tracked_objects:
            x_center, y_center = obj.center
            compensated_x = x_center - self.camera_motion[0]
            compensated_y = y_center - self.camera_motion[1]
            compensated_center = np.array([compensated_x, compensated_y], dtype=np.float32)
            
            prev = self.prev_positions.get(obj.object_id)
            motion = 'static'
            
            if prev is not None:
                # Calculate raw speed
                raw_speed = np.linalg.norm(compensated_center - prev)
                
                # Apply smoothing and minimum threshold
                speed = self.get_smoothed_speed(obj.object_id, raw_speed)
                
                # Only consider motion if above minimum threshold
                if speed > Config.MOTION.min_speed_threshold:
                    if speed > Config.MOTION.slow_threshold:
                        motion = 'fast'
                    elif speed > Config.MOTION.static_threshold:
                        motion = 'slow'
                    
                    # Debug output for speed
                    print(f"Object {obj.object_id} - Raw Speed: {raw_speed:.1f}, Smoothed: {speed:.1f}, State: {motion}")
            
            self.prev_positions[obj.object_id] = compensated_center
            
            # Update dominant motion with hysteresis
            if motion == 'fast':
                frame_dominant_motion = 'fast'
            elif motion == 'slow' and frame_dominant_motion != 'fast':
                frame_dominant_motion = 'slow'
            elif motion == 'static' and frame_dominant_motion == 'none':
                frame_dominant_motion = 'static'
            
            # Calculate distance
            x1, y1, x2, y2 = obj.bbox
            w = x2 - x1
            h = y2 - y1
            
            if obj.class_name == 'tv':
                pixel_size = w  # width-based for TV
                real_size = Config.DIMENSIONS.widths.get('tv', 100)
            else:
                pixel_size = np.sqrt(w ** 2 + h ** 2)  # use diagonal
                real_size = Config.DIMENSIONS.heights.get(obj.class_name, 100)
            
            if pixel_size > 0:
                distance_m = (real_size * Config.CAMERA.focal_length) / (pixel_size * 100.0)
                distances.append(distance_m)
            
            # Update object's motion state
            obj.motion_state = motion
            obj.distance = distance_m if pixel_size > 0 else -1.0
        
        # Clean up untracked objects
        self.prev_positions = {oid: pos for oid, pos in self.prev_positions.items() 
                             if oid in current_ids}
        
        return frame_dominant_motion, distances 