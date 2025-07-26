"""Configuration settings for the EarEye detector."""

import os
from dataclasses import dataclass
from typing import Dict

@dataclass
class ObjectDimensions:
    """Real-world dimensions of objects in centimeters"""
    heights: Dict[str, float]
    widths: Dict[str, float]

@dataclass
class MotionConfig:
    """Configuration for motion detection thresholds"""
    static_threshold: float  # pixels per frame
    slow_threshold: float   # pixels per frame
    smoothing_factor: float = 0.7  # Higher value = more smoothing (0-1)
    min_speed_threshold: float = 5.0  # Minimum speed to consider as movement

@dataclass
class CameraConfig:
    """Camera-specific configuration"""
    focal_length: float
    frame_width: int = 1280
    frame_height: int = 720

@dataclass
class AudioConfig:
    """Audio system configuration"""
    frequency: int = 44100
    size: int = -16
    channels: int = 2
    buffer: int = 512
    crossfade_time: float = 0.2
    volume_smoothing: float = 0.15
    max_volume: float = 0.7
    cooldown_sec: float = 0.5

class Config:
    """Global configuration container"""
    TARGET_CLASSES = [
        'car', 'person', 'couch', 'chair', 'bed', 'dining table', 'plant'
    ]

    DIMENSIONS = ObjectDimensions(
        heights={
            'person': 170,
            'car': 150,
            'couch': 90,
            'chair': 100,
            'bed': 60,
            'dining table': 75,
            'tv': 60
        },
        widths={'tv': 100}
    )

    MOTION = MotionConfig(
        static_threshold=25,    # Need more movement to exit static state
        slow_threshold=120,     # Significantly increased - need much more movement for fast state
        smoothing_factor=0.7,   # 70% of previous speed + 30% of new speed
        min_speed_threshold=5.0 # Minimum speed to register as movement
    )

    CAMERA = CameraConfig(
        focal_length=400
    )

    AUDIO = AudioConfig()

    @classmethod
    def get_sound_paths(cls) -> tuple[str, str, str]:
        """Get paths to sound files"""
        sound_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets')
        return (
            sound_dir,
            os.path.join(sound_dir, 'fast.wav'),
            os.path.join(sound_dir, 'slow.wav')
        ) 