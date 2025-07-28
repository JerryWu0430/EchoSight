# EchoSight
Project that won [SoTa's Human Augmentation Hackathon](https://lu.ma/1au1lxbt?tk=N9hNV7) 2nd place!


EchoSight is an innovative computer vision project that translates visual information into spatial audio feedback, designed to assist users in understanding their environment through sound. The system detects objects, tracks their movement, and generates real-time audio cues based on object position, distance, and motion states.

## Features

- **Real-time Object Detection**: Detects and tracks multiple objects using YOLOv8
- **Spatial Audio Feedback**: 
  - Stereo audio positioning (left/right) based on object location
  - Distance-based volume scaling
  - Different sounds for different motion states:
    - Static objects (furniture, stationary items)
    - Slow movement
    - Fast movement

- **Smart Motion Analysis**:
  - Automatic classification of object movement
  - Special handling for stationary objects (chairs, tables, etc.)
  - Camera motion compensation
  - Intelligent motion state transitions

- **Configurable Settings**:
  - Adjustable motion thresholds
  - Customizable audio parameters
  - Configurable object dimensions
  - Flexible camera settings

## Setup

1. Create and activate virtual environment:
```bash
python3 -m venv venv 
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Run the static detector demo:
```bash
python3 -m detector_static
```

### Understanding the Display

The visualization shows:
- Object class name
- Motion state (static/slow/fast)
- Distance in meters
- Audio position (Left/Right/Center with intensity)

### Audio Feedback

The system provides three types of audio feedback:
1. **Static Sound**: Short beeps for stationary objects
2. **Slow Movement**: Guitar sound for slow-moving objects
3. **Fast Movement**: Cello sound for fast-moving objects

Audio features:
- Volume decreases with distance
- Stereo panning based on object position
- Automatic focus on closest object
- Smart cooldown system for static sounds

## Configuration

Key settings can be adjusted in `detector_static/config/settings.py`:

- Motion thresholds
- Audio parameters
- Camera settings
- Object dimensions

## Technical Details

- **Motion Detection**: Uses advanced motion analysis with camera motion compensation
- **Audio Engine**: Smooth stereo transitions with distance-based volume scaling
- **Object Tracking**: Centroid-based tracking with motion state management
- **Performance**: Optimized for real-time processing on standard hardware

## Requirements

- Python 3.x
- OpenCV
- PyGame (for audio)
- YOLOv8
- NumPy
- Additional dependencies in requirements.txt
