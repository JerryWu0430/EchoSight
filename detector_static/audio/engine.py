"""Audio feedback engine."""

import os
import pygame
import threading
import math
from collections import deque
from threading import Lock
from typing import Dict, List

from ..config.settings import Config

class AudioInitializationError(Exception):
    """Exception raised when audio initialization fails."""
    pass

class SoundFileError(Exception):
    """Exception raised when sound files cannot be loaded."""
    pass

class SmoothAudioEngine:
    """Handles smooth audio transitions and playback"""
    def __init__(self, sound_dir: str):
        if not os.path.isdir(sound_dir):
            raise AudioInitializationError(f"Sound directory not found: {sound_dir}")
            
        self.sound_dir = sound_dir
        self.sounds: Dict[str, pygame.mixer.Sound] = {}
        self.channels: Dict[str, pygame.mixer.Channel] = {}
        self.target_volumes: Dict[str, float] = {}
        self.current_volumes: Dict[str, float] = {}
        self.lock = Lock()
        
        # Audio parameters from config
        self.crossfade_time = Config.AUDIO.crossfade_time
        self.volume_smoothing = Config.AUDIO.volume_smoothing
        self.max_volume = 2.0  # Increased to 200% for dramatic effect
        
        # Distance-based volume parameters
        self.min_distance = 0.3  # meters, closer distance for max volume
        self.max_distance = 4.0  # meters, shorter range for min volume
        self.min_volume_factor = 0.05  # 5% volume at max distance
        self.distance_curve = 3.0  # Steeper falloff curve
        
        # Motion state tracking
        self.current_state = 'none'
        self.state_history: deque = deque(maxlen=5)  # Smooth state transitions
        
        # Initialize pygame mixer
        self._initialize_pygame()
        
        # Initialize audio system
        self._initialize_audio()
        
    def _initialize_pygame(self) -> None:
        """Initialize pygame mixer with configuration"""
        try:
            # Ensure pygame is initialized
            if not pygame.get_init():
                pygame.init()
            
            # Quit and reinitialize mixer
            if pygame.mixer.get_init():
                pygame.mixer.quit()
                
            pygame.mixer.pre_init(
                frequency=Config.AUDIO.frequency,
                size=Config.AUDIO.size,
                channels=Config.AUDIO.channels,
                buffer=Config.AUDIO.buffer
            )
            pygame.mixer.init()
            
            if not pygame.mixer.get_init():
                raise AudioInitializationError("Failed to initialize pygame mixer")
                
            print("DEBUG: Pygame mixer initialized successfully")
        except Exception as e:
            raise AudioInitializationError(f"Failed to initialize pygame mixer: {str(e)}")
        
    def _initialize_audio(self) -> None:
        """Initialize the audio system with sound files"""
        sound_files = {
            'fast': 'fast.wav',
            'slow': 'slow.wav'
        }
        
        try:
            pygame.mixer.set_num_channels(8)  # Set up channels for mixing
        except Exception as e:
            raise AudioInitializationError(f"Failed to set mixer channels: {str(e)}")
        
        missing_files = []
        failed_loads = []
        
        for sound_name, filename in sound_files.items():
            filepath = os.path.join(self.sound_dir, filename)
            if not os.path.exists(filepath):
                missing_files.append(filepath)
                continue
                
            try:
                sound = pygame.mixer.Sound(filepath)
                self.sounds[sound_name] = sound
                
                channel_id = len(self.channels)
                self.channels[sound_name] = pygame.mixer.Channel(channel_id)
                
                self.current_volumes[sound_name] = 0.0
                self.target_volumes[sound_name] = 0.0
                
                print(f"DEBUG: Loaded sound: {sound_name}")
            except Exception as e:
                failed_loads.append((sound_name, str(e)))
        
        if missing_files or failed_loads:
            error_msg = []
            if missing_files:
                error_msg.append(f"Missing files: {', '.join(missing_files)}")
            if failed_loads:
                error_msg.append(f"Failed to load: {', '.join(f'{name} ({err})' for name, err in failed_loads)}")
            raise SoundFileError('\n'.join(error_msg))
        
        # Start the audio update thread
        self.running = True
        self.audio_thread = threading.Thread(target=self._audio_update_loop, daemon=True)
        self.audio_thread.start()

    def _audio_update_loop(self) -> None:
        """Continuous smooth audio processing"""
        clock = pygame.time.Clock()
        
        while self.running:
            with self.lock:
                self._update_volumes()
                self._update_playback()
            
            clock.tick(60)  # 60 FPS for smooth audio
    
    def _update_volumes(self) -> None:
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
    
    def _update_playback(self) -> None:
        """Update sound playback with smooth crossfading"""
        for sound_name, sound in self.sounds.items():
            channel = self.channels[sound_name]
            volume = self.current_volumes[sound_name]
            
            if volume > 0.01:  # Should be playing
                if not channel.get_busy():
                    channel.play(sound, loops=-1)
                channel.set_volume(volume)
            else:  # Should be silent
                if channel.get_busy():
                    fadeout_time = int(self.crossfade_time * 1000)
                    channel.fadeout(fadeout_time)
    
    def smooth_state_transition(self, new_state: str) -> str:
        """Apply smoothing to state changes to prevent jitter"""
        self.state_history.append(new_state)
        
        if len(self.state_history) >= 3:
            state_counts: Dict[str, int] = {}
            for state in self.state_history:
                state_counts[state] = state_counts.get(state, 0) + 1
            
            most_common = max(state_counts, key=state_counts.get)
            return most_common
        
        return new_state

    def calculate_distance_volume(self, distance: float) -> float:
        """
        Calculate volume based on distance using an exponential falloff curve.
        
        Args:
            distance: Distance to object in meters
            
        Returns:
            Volume factor between 0 and 1
        """
        # Clamp distance between min and max
        clamped_distance = max(self.min_distance, min(self.max_distance, distance))
        
        # Calculate normalized distance (0 to 1)
        normalized_distance = (clamped_distance - self.min_distance) / (self.max_distance - self.min_distance)
        
        # Apply exponential falloff curve with more dramatic scaling
        volume_factor = math.exp(-self.distance_curve * normalized_distance)
        
        # Scale between min and max volume with more dramatic range
        volume_factor = self.min_volume_factor + (1 - self.min_volume_factor) * volume_factor
        
        # Apply additional boost for close objects
        if distance < self.min_distance * 1.5:  # Extra boost zone
            boost_factor = 1 + (1 - distance / (self.min_distance * 1.5))  # Up to 2x boost
            volume_factor *= boost_factor
            
        return min(volume_factor, 1.0)  # Ensure we don't exceed 100% per channel
        
    def update_from_motion_state(self, frame_dominant_motion: str, distances: List[float], has_objects: bool) -> None:
        """Update audio based on motion detection and object distances"""
        with self.lock:
            smoothed_state = self.smooth_state_transition(frame_dominant_motion)
            
            # Reset all volumes
            for sound_name in self.target_volumes:
                self.target_volumes[sound_name] = 0.0
            
            if not has_objects:
                return
            
            # Calculate base volume using closest object
            base_volume = self.max_volume  # Now 200% max
            if distances:
                min_distance = min(distances)
                volume_factor = self.calculate_distance_volume(min_distance)
                base_volume *= volume_factor
                
                # Debug output for volume scaling
                print(f"Distance: {min_distance:.1f}m, Volume: {(volume_factor * 100):.1f}%")
            
            # Set target volumes based on smoothed state with more dramatic differences
            if smoothed_state == 'fast':
                self.target_volumes['fast'] = base_volume
                # Reduced layering volume for better contrast
                self.target_volumes['slow'] = base_volume * 0.15
            elif smoothed_state == 'slow':
                self.target_volumes['slow'] = base_volume
    
    def cleanup(self) -> None:
        """Clean shutdown of audio system"""
        self.running = False
        if hasattr(self, 'audio_thread') and self.audio_thread.is_alive():
            self.audio_thread.join(timeout=1.0)
            
        # Clean up pygame resources
        try:
            pygame.mixer.stop()
            pygame.mixer.quit()
            pygame.quit()
        except Exception as e:
            print(f"WARNING: Error during pygame cleanup: {str(e)}")

def create_smooth_audio_system(sound_dir: str) -> SmoothAudioEngine:
    """Create and initialize the smooth audio system"""
    return SmoothAudioEngine(sound_dir)

def play_sound_async_smooth(audio_engine: SmoothAudioEngine, 
                          motion_state: str, 
                          distances: List[float], 
                          has_objects: bool) -> None:
    """Update audio engine state based on motion and objects"""
    audio_engine.update_from_motion_state(motion_state, distances, has_objects) 