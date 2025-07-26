"""Common type definitions."""

from dataclasses import dataclass
from typing import Tuple

@dataclass
class TrackedObject:
    """Represents a tracked object with its position and metadata"""
    object_id: int
    center: Tuple[float, float]
    class_name: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    motion_state: str = 'unknown'
    distance: float = -1.0 