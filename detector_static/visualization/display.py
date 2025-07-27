"""Visualization functionality for detected objects."""

import cv2
import numpy as np
from typing import List

from ..utils.types import TrackedObject
from ..config.settings import Config

class Visualizer:
    """Handles visualization of detection and tracking results"""
    @staticmethod
    def draw_results(frame: np.ndarray, tracked_objects: List[TrackedObject]) -> np.ndarray:
        """Draw bounding boxes and labels for tracked objects"""
        frame_width = Config.CAMERA.frame_width
        
        for obj in tracked_objects:
            x1, y1, x2, y2 = obj.bbox
            x_center, y_center = obj.center
            motion = getattr(obj, 'motion_state', 'unknown')
            distance = getattr(obj, 'distance', -1.0)
            
            # Calculate stereo position (left/right)
            normalized_pos = x_center / frame_width
            if normalized_pos < 0.45:  # Left side
                stereo_pos = f"Left ({(0.5 - normalized_pos) * 200:.0f}%)"
            elif normalized_pos > 0.55:  # Right side
                stereo_pos = f"Right ({(normalized_pos - 0.5) * 200:.0f}%)"
            else:  # Center
                stereo_pos = "Center"
            
            # Format location coordinates with 1 decimal place
            location_text = f"({x_center:.1f}, {y_center:.1f})"
            
            # Create multi-line label
            label_lines = [
                f'{obj.class_name}',
                f'Motion: {motion}',
                f'Dist: {distance:.1f}m',
                f'Audio: {stereo_pos}'
            ]
            
            # Draw bounding box
            color = (0, 255, 0) if motion == 'static' else \
                    (0, 255, 255) if motion == 'slow' else \
                    (0, 0, 255)
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw center point
            cv2.circle(frame, (int(x_center), int(y_center)), 4, color, -1)
            
            # Draw multi-line label
            text_y = y1 - 10
            for line in label_lines:
                text_size = cv2.getTextSize(line, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
                text_x = x1  # Align with left edge of bounding box
                
                # Draw background rectangle for better text visibility
                cv2.rectangle(frame, 
                            (text_x - 2, text_y - text_size[1] - 2),
                            (text_x + text_size[0] + 2, text_y + 2),
                            (0, 0, 0),
                            -1)
                            
                cv2.putText(frame, line, (text_x, text_y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                text_y -= text_size[1] + 5  # Move up for next line
        
        return frame 