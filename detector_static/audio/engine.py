"""Audio feedback engine."""

import os
import pygame
import threading
import math
from collections import deque
from threading import Lock
from typing import Dict, List, Tuple
import numpy
import time

from ..config.settings import Config

class AudioInitializationError(Exception):
    """Exception raised when audio initialization fails."""
    pass

class SoundFileError(Exception):
    """Exception raised when sound files cannot be loaded."""
    pass

class StereoPanner:
    """Handles stereo panning calculations"""
    def __init__(self, frame_width: int):
        self.frame_width = frame_width
        self.center_threshold = 0.1  # 10% of width around center where both channels play
        
    def calculate_pan(self, x_position: float) -> Tuple[float, float]:
        """
        Calculate left and right channel volumes based on x position.
        Complete separation - when on left side, right channel is silent and vice versa.
        
        Args:
            x_position: X coordinate in frame (0 to frame_width)
            
        Returns:
            Tuple of (left_scale, right_scale) between 0 and 1
        """
        # Convert position to normalized value (0 to 1)
        normalized_pos = x_position / self.frame_width
        
        # Define center region
        center_min = 0.5 - self.center_threshold
        center_max = 0.5 + self.center_threshold
        
        if normalized_pos < center_min:
            # Left side - only left channel plays
            return 1.0, 0.0
        elif normalized_pos > center_max:
            # Right side - only right channel plays
            return 0.0, 1.0
        else:
            # Center region - smooth transition
            # Map center region to 0-1 range
            center_pos = (normalized_pos - center_min) / (center_max - center_min)
            # Linear crossfade in center region
            return 1.0 - center_pos, center_pos

class SmoothAudioEngine:
    """Handles smooth audio transitions and playback"""
    def __init__(self, sound_dir: str):
        if not os.path.isdir(sound_dir):
            raise AudioInitializationError(f"Sound directory not found: {sound_dir}")
            
        self.sound_dir = sound_dir
        self.sounds: Dict[str, Dict[str, pygame.mixer.Sound]] = {}  # sound_name -> {'left', 'right'} sounds
        self.channels: Dict[str, Dict[str, pygame.mixer.Channel]] = {}  # sound_name -> {'left', 'right'} channels
        self.target_volumes: Dict[str, float] = {}
        self.current_volumes: Dict[str, float] = {}
        self.current_x_position: float = Config.CAMERA.frame_width / 2
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
        
        # Stereo panning
        self.panner = StereoPanner(Config.CAMERA.frame_width)

        # Motion state tracking
        self.current_state = 'none'
        self.state_history: deque = deque(maxlen=5)  # Smooth state transitions
        
        # Static sound cooldown tracking
        self.last_static_time = 0
        self.static_cooldown = Config.AUDIO.static_cooldown_sec
        self.static_volume = Config.AUDIO.static_volume
        
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
            
            # Initialize with stereo
            pygame.mixer.pre_init(
                frequency=Config.AUDIO.frequency,
                size=Config.AUDIO.size,
                channels=2,  # Stereo
                buffer=Config.AUDIO.buffer
            )
            pygame.mixer.init()
            
            if not pygame.mixer.get_init():
                raise AudioInitializationError("Failed to initialize pygame mixer")
                
            print("DEBUG: Pygame mixer initialized successfully")
        except Exception as e:
            raise AudioInitializationError(f"Failed to initialize pygame mixer: {str(e)}")
        
    def _create_stereo_sound(self, filepath: str, sound_name: str) -> Tuple[pygame.mixer.Sound, pygame.mixer.Sound]:
        """Create left and right channel versions of a sound"""
        try:
            # Load the original sound
            sound = pygame.mixer.Sound(filepath)
            array = pygame.sndarray.array(sound)  # Get sound as numpy array
            
            # Create stereo versions (one channel silent)
            stereo_shape = (array.shape[0], 2)  # Force stereo shape
            
            # Left channel version (right channel silent)
            left_array = numpy.zeros(stereo_shape, dtype=array.dtype)
            left_array[:, 0] = array[:, 0]  # Copy left channel
            
            # Right channel version (left channel silent)
            right_array = numpy.zeros(stereo_shape, dtype=array.dtype)
            right_array[:, 1] = array[:, 0]  # Copy to right channel
            
            # Convert back to pygame sounds
            left_sound = pygame.sndarray.make_sound(left_array)
            right_sound = pygame.sndarray.make_sound(right_array)
            
            return left_sound, right_sound
            
        except Exception as e:
            raise SoundFileError(f"Failed to create stereo sound {sound_name}: {str(e)}")
        
    def _initialize_audio(self) -> None:
        """Initialize the audio system with sound files"""
        sound_files = {
            'fast': 'cello_A2_025_forte_arco-normal.mp3',
            'slow': 'guitar_A3_very-long_piano_normal.mp3',
            'static': 'english-horn_A3_025_mezzo-forte_normal.mp3',
        }
        
        try:
            pygame.mixer.set_num_channels(16)  # Increased for stereo pairs
        except Exception as e:
            raise AudioInitializationError(f"Failed to set mixer channels: {str(e)}")
        
        missing_files = []
        failed_loads = []
        channel_id = 0
        
        for sound_name, filename in sound_files.items():
            filepath = os.path.join(self.sound_dir, filename)
            if not os.path.exists(filepath):
                missing_files.append(filepath)
                continue
                
            try:
                # Create stereo versions of the sound
                left_sound, right_sound = self._create_stereo_sound(filepath, sound_name)
                
                # Store sounds
                self.sounds[sound_name] = {
                    'left': left_sound,
                    'right': right_sound
                }
                
                # Create stereo channel pair
                self.channels[sound_name] = {
                    'left': pygame.mixer.Channel(channel_id),
                    'right': pygame.mixer.Channel(channel_id + 1)
                }
                channel_id += 2
                
                self.current_volumes[sound_name] = 0.0
                self.target_volumes[sound_name] = 0.0
                
                print(f"DEBUG: Loaded stereo sound: {sound_name}")
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
        """Update sound playback with smooth crossfading and stereo panning"""
        for sound_name, sounds in self.sounds.items():
            channels = self.channels[sound_name]
            volume = self.current_volumes[sound_name]
            
            if volume > 0.01:  # Should be playing
                # Calculate stereo panning based on current position
                left_scale, right_scale = self.panner.calculate_pan(self.current_x_position)
                
                # Update left channel
                if left_scale > 0:
                    if not channels['left'].get_busy():
                        channels['left'].play(sounds['left'], loops=-1)
                    channels['left'].set_volume(volume * left_scale)
                else:
                    if channels['left'].get_busy():
                        channels['left'].stop()
                
                # Update right channel
                if right_scale > 0:
                    if not channels['right'].get_busy():
                        channels['right'].play(sounds['right'], loops=-1)
                    channels['right'].set_volume(volume * right_scale)
                else:
                    if channels['right'].get_busy():
                        channels['right'].stop()
            else:  # Should be silent
                fadeout_time = int(self.crossfade_time * 1000)
                for channel in channels.values():
                    if channel.get_busy():
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
        
    def play_static(self) -> None:
        """Play static sound if cooldown has elapsed"""
        current_time = time.time()
        if current_time - self.last_static_time >= self.static_cooldown:
            with self.lock:
                # Set static sound volume
                self.target_volumes['static'] = self.static_volume
                self.last_static_time = current_time
                
                # Schedule static sound to stop after a short duration
                threading.Timer(0.5, self.stop_static).start()  # Increased duration to 0.5 seconds

    def stop_static(self) -> None:
        """Stop static sound"""
        with self.lock:
            self.target_volumes['static'] = 0.0

    def update_from_motion_state(self, frame_dominant_motion: str, distances: List[float], 
                               has_objects: bool, x_positions: List[float] = None) -> None:
        """
        Update audio based on motion detection, object distances, and positions.
        
        Args:
            frame_dominant_motion: Current motion state
            distances: List of object distances
            has_objects: Whether objects are detected
            x_positions: List of object x positions for stereo panning
        """
        with self.lock:
            # Reset all volumes except static
            for sound_name in self.target_volumes:
                if sound_name != 'static':  # Don't reset static volume
                    self.target_volumes[sound_name] = 0.0
            
            if not has_objects or not distances:
                return
            
            # Find the closest object and its index
            min_distance = min(distances)
            closest_idx = distances.index(min_distance)
            
            # Calculate volume based on distance
            base_volume = self.max_volume
            volume_factor = self.calculate_distance_volume(min_distance)
            base_volume *= volume_factor
            
            # Update x position for panning (use position of closest object)
            if x_positions and len(x_positions) == len(distances):
                self.current_x_position = x_positions[closest_idx]
            
            # Get motion state of closest object
            if frame_dominant_motion == 'fast':
                self.target_volumes['fast'] = base_volume
            elif frame_dominant_motion == 'slow':
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
                          has_objects: bool,
                          x_positions: List[float] = None) -> None:
    """
    Update audio engine state based on motion and objects.
    
    Args:
        audio_engine: The audio engine instance
        motion_state: Current motion state ('static', 'slow', 'fast')
        distances: List of object distances
        has_objects: Whether objects are detected
        x_positions: Optional list of object x positions for stereo panning
    """
    # Only play static sound if the closest object is static
    if motion_state == 'static' and has_objects and distances:
        audio_engine.play_static()
        
    audio_engine.update_from_motion_state(motion_state, distances, has_objects, x_positions) 