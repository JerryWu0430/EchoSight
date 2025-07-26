"""Object tracking functionality."""

import numpy as np
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass
import time

@dataclass
class TrackedPoint:
    """Stores tracking information for a single point"""
    position: np.ndarray
    velocity: np.ndarray
    last_update: float
    lost_count: int = 0

class CentroidTracker:
    """Tracks objects across frames using centroid-based matching with velocity prediction"""
    def __init__(self, 
                 max_distance: float = 150.0,  # Increased from 50 to handle faster motion
                 max_lost: int = 10,  # Number of frames before considering object lost
                 velocity_weight: float = 0.7):  # Weight for velocity prediction (0-1)
        self.next_object_id = 0
        self.objects: Dict[int, TrackedPoint] = {}
        self.max_distance = max_distance
        self.max_lost = max_lost
        self.velocity_weight = velocity_weight

    def predict_new_position(self, tracked_point: TrackedPoint) -> np.ndarray:
        """Predict new position based on velocity and time since last update"""
        current_time = time.time()
        dt = current_time - tracked_point.last_update
        
        # Predict new position using current velocity
        predicted_pos = tracked_point.position + tracked_point.velocity * dt
        return predicted_pos

    def update_tracked_point(self, 
                           tracked_point: TrackedPoint, 
                           new_position: np.ndarray,
                           current_time: float) -> None:
        """Update tracked point with new position and velocity"""
        dt = current_time - tracked_point.last_update
        if dt > 0:
            # Calculate new velocity
            new_velocity = (new_position - tracked_point.position) / dt
            # Smooth velocity update
            tracked_point.velocity = (self.velocity_weight * tracked_point.velocity + 
                                   (1 - self.velocity_weight) * new_velocity)
        
        tracked_point.position = new_position
        tracked_point.last_update = current_time
        tracked_point.lost_count = 0

    def update(self, detections: List[Tuple[float, float]]) -> List[Tuple[int, Tuple[float, float]]]:
        """
        Update object tracking with new detections.
        
        Args:
            detections: List of (x, y) positions for detected objects
            
        Returns:
            List of (object_id, (x, y)) for tracked objects
        """
        current_time = time.time()
        
        # Convert detections to numpy arrays for easier computation
        detection_points = [np.array(d) for d in detections]
        
        if len(detection_points) == 0:
            # Increment lost count for all objects
            for tracked_point in self.objects.values():
                tracked_point.lost_count += 1
            
            # Remove objects lost for too many frames
            self.objects = {
                obj_id: tracked_point 
                for obj_id, tracked_point in self.objects.items() 
                if tracked_point.lost_count < self.max_lost
            }
            return []

        matched_or_new_objects: List[Tuple[int, Tuple[float, float]]] = []
        used_detection_indices: Set[int] = set()

        # First pass: Try to match objects using predicted positions
        for obj_id, tracked_point in list(self.objects.items()):
            predicted_pos = self.predict_new_position(tracked_point)
            min_dist = self.max_distance
            best_det_idx = -1

            # Find closest detection to predicted position
            for i, detection in enumerate(detection_points):
                if i not in used_detection_indices:
                    dist = np.linalg.norm(detection - predicted_pos)
                    if dist < min_dist:
                        min_dist = dist
                        best_det_idx = i

            if best_det_idx != -1:
                # Update tracked point
                new_pos = detection_points[best_det_idx]
                self.update_tracked_point(tracked_point, new_pos, current_time)
                
                matched_or_new_objects.append((obj_id, tuple(new_pos)))
                used_detection_indices.add(best_det_idx)
            else:
                # Increment lost count for unmatched objects
                tracked_point.lost_count += 1

        # Second pass: Create new objects for unmatched detections
        for i, detection in enumerate(detection_points):
            if i not in used_detection_indices:
                # Create new tracked point
                new_tracked_point = TrackedPoint(
                    position=detection,
                    velocity=np.zeros(2),
                    last_update=current_time
                )
                self.objects[self.next_object_id] = new_tracked_point
                
                matched_or_new_objects.append((self.next_object_id, tuple(detection)))
                self.next_object_id += 1

        # Clean up lost objects
        self.objects = {
            obj_id: tracked_point 
            for obj_id, tracked_point in self.objects.items() 
            if tracked_point.lost_count < self.max_lost
        }

        return matched_or_new_objects 