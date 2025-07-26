"""Main application module."""

import cv2
import time
import sys
from typing import List, Tuple

from ..config.settings import Config
from ..core.detector import ObjectDetector
from ..motion.analyzer import MotionAnalyzer
from ..visualization.display import Visualizer
from ..audio.engine import (
    create_smooth_audio_system, 
    play_sound_async_smooth,
    AudioInitializationError,
    SoundFileError
)

class Application:
    """Main application class that coordinates all components"""
    def __init__(self):
        self.detector = ObjectDetector()
        self.motion_analyzer = MotionAnalyzer()
        self.visualizer = Visualizer()
        
        # Initialize camera
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            raise RuntimeError('Error: Could not open camera.')
            
        # Initialize audio
        sound_dir, _, _ = Config.get_sound_paths()
        try:
            self.audio_engine = create_smooth_audio_system(sound_dir)
            self.audio_enabled = True
        except (AudioInitializationError, SoundFileError) as e:
            print(f"WARNING: Audio system disabled - {str(e)}")
            print("The application will continue without audio feedback.")
            self.audio_enabled = False
        except Exception as e:
            print(f"ERROR: Unexpected audio initialization error - {str(e)}")
            raise
        
        # State tracking
        self.current_dominant_motion = None
        self.last_sound_play_time = time.time()
        
    def process_frame(self) -> bool:
        """Process a single frame. Returns False if should exit."""
        # Capture frame
        ret, frame = self.cap.read()
        if not ret:
            print('Error: Failed to capture frame')
            return False
            
        # Detect and track objects
        tracked_objects, frame_resized = self.detector.detect_and_track(frame)
        
        # Convert to grayscale for motion analysis
        gray = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)
        
        # Analyze motion
        self.motion_analyzer.estimate_camera_motion(gray)
        frame_dominant_motion, distances = self.motion_analyzer.analyze_object_motion(tracked_objects)
        
        # Update visualization
        frame_resized = self.visualizer.draw_results(frame_resized, tracked_objects)
        
        # Update audio if enabled
        if self.audio_enabled:
            current_time = time.time()
            has_objects = bool(tracked_objects)
            
            # Always update the smooth audio system
            play_sound_async_smooth(self.audio_engine, frame_dominant_motion, distances, has_objects)
            
            # Update timing for compatibility
            if frame_dominant_motion != self.current_dominant_motion and has_objects:
                self.last_sound_play_time = current_time
                self.current_dominant_motion = frame_dominant_motion
                print(f"  --- Smooth Audio Update! Motion: {self.current_dominant_motion} ---")
            
            if not has_objects and self.current_dominant_motion != 'none':
                self.current_dominant_motion = 'none'
                print(f"  Smooth audio fading to silence (no objects detected).")
        
        # Display results
        cv2.imshow('Detection & Motion', frame_resized)
        
        # Check for exit
        return cv2.waitKey(1) & 0xFF != ord('q')
    
    def run(self):
        """Main application loop"""
        try:
            while self.process_frame():
                pass
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        if self.audio_enabled:
            try:
                self.audio_engine.cleanup()
            except Exception as e:
                print(f"WARNING: Error during audio cleanup - {str(e)}")
        
        self.cap.release()
        cv2.destroyAllWindows()

def main():
    """Application entry point"""
    try:
        app = Application()
        app.run()
    except KeyboardInterrupt:
        print("\nApplication stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 