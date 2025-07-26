"""Object tracking functionality."""

import numpy as np
from typing import Dict, List, Set, Tuple

class CentroidTracker:
    """Tracks objects across frames using centroid-based matching"""
    def __init__(self, max_distance: float = 50):
        self.next_object_id = 0
        self.objects: Dict[int, Tuple[float, float]] = {}
        self.max_distance = max_distance

    def update(self, detections: List[Tuple[float, float]]) -> List[Tuple[int, Tuple[float, float]]]:
        """Update object tracking with new detections"""
        if len(detections) == 0:
            self.objects = {}
            return []

        matched_or_new_objects: List[Tuple[int, Tuple[float, float]]] = []
        used_detection_indices: Set[int] = set()
        matched_existing_object_ids: Set[int] = set()

        # Match existing objects to new detections
        for obj_id, existing_center in list(self.objects.items()):
            min_dist = self.max_distance + 1
            best_det_idx = -1

            # Find closest detection to this object
            for i, new_det_center in enumerate(detections):
                if i not in used_detection_indices:
                    dist = np.linalg.norm(np.array(new_det_center) - np.array(existing_center))
                    if dist < min_dist:
                        min_dist = dist
                        best_det_idx = i
            
            # Update matched object
            if best_det_idx != -1 and min_dist <= self.max_distance:
                new_det_center = detections[best_det_idx]
                self.objects[obj_id] = new_det_center
                matched_or_new_objects.append((obj_id, new_det_center))
                used_detection_indices.add(best_det_idx)
                matched_existing_object_ids.add(obj_id)
        
        # Register new objects for unmatched detections
        for i in range(len(detections)):
            if i not in used_detection_indices:
                new_det_center = detections[i]
                self.objects[self.next_object_id] = new_det_center
                matched_or_new_objects.append((self.next_object_id, new_det_center))
                self.next_object_id += 1
        
        # Clean up unmatched objects
        self.objects = {oid: self.objects[oid] for oid in self.objects 
                       if oid in {item[0] for item in matched_or_new_objects}}
        
        return matched_or_new_objects 