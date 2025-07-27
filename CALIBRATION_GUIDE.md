# Calibration Guide for SoTA EarEye Detector

## Overview
This guide explains the key parameters in `detector.py` and how to calibrate them for your specific setup.

## Key Parameters Explained

### 1. FOCAL_LENGTH (Line 203)
```python
FOCAL_LENGTH = 400
```

**What it does:** Used to calculate the real-world distance to detected objects using the formula:
```
distance_m = (real_size * FOCAL_LENGTH) / (pixel_size * 100.0)
```

**How to calibrate:**
1. **Method 1 - Known Object Distance:**
   - Place a person (or known object) at exactly 2 meters from your camera
   - Run the detector and note the displayed distance
   - If it shows 1.5m instead of 2.0m, multiply FOCAL_LENGTH by (2.0/1.5) = 1.33
   - New FOCAL_LENGTH = 400 * 1.33 = 533

2. **Method 2 - Camera Specifications:**
   - Find your camera's focal length in mm (e.g., 35mm)
   - Convert to pixels: FOCAL_LENGTH = (focal_length_mm * sensor_width_pixels) / sensor_width_mm
   - For most webcams: try values between 300-600

**Typical values:**
- Webcam: 300-500
- Phone camera: 400-800
- DSLR: 1000-3000

### 2. Motion Thresholds (Lines 206-207)
```python
STATIC_THRESH = 15    # pixels per frame
SLOW_THRESH = 50      # pixels per frame
```

**What they do:**
- `STATIC_THRESH`: Minimum movement to be considered "slow motion"
- `SLOW_THRESH`: Minimum movement to be considered "fast motion"
- Movement < STATIC_THRESH = "static" (green box)
- STATIC_THRESH ≤ movement < SLOW_THRESH = "slow" (yellow box)
- Movement ≥ SLOW_THRESH = "fast" (red box)

**How to calibrate:**

#### Step 1: Test Current Settings
1. Run the detector: `python detector.py`
2. Move slowly in front of the camera
3. Observe the color changes:
   - Green = static
   - Yellow = slow
   - Red = fast

#### Step 2: Adjust Based on Your Needs

**For More Sensitive Detection (detects smaller movements):**
```python
STATIC_THRESH = 8    # Lower = more sensitive to small movements
SLOW_THRESH = 25     # Lower = easier to trigger "fast" motion
```

**For Less Sensitive Detection (ignores small movements):**
```python
STATIC_THRESH = 25   # Higher = ignores small movements
SLOW_THRESH = 80     # Higher = requires more movement for "fast"
```

**Recommended starting values by use case:**

| Use Case | STATIC_THRESH | SLOW_THRESH | Notes |
|----------|---------------|-------------|-------|
| Close-up (1-2m) | 10-15 | 30-50 | More sensitive for close objects |
| Medium distance (2-4m) | 15-25 | 50-80 | Balanced sensitivity |
| Far distance (4m+) | 20-35 | 70-120 | Less sensitive to avoid false triggers |
| High camera resolution | 20-40 | 60-100 | Scale with resolution |
| Low camera resolution | 8-15 | 25-50 | Scale with resolution |

### 3. CentroidTracker max_distance (Line 232)
```python
class CentroidTracker:
    def __init__(self, max_distance=50):
```

**What it does:** Maximum distance (in pixels) between object positions in consecutive frames to be considered the same object.

**How to calibrate:**
- **Too low (e.g., 20):** Objects get new IDs when they move quickly
- **Too high (e.g., 100):** Different objects might be confused as the same
- **Recommended:** 30-70 depending on your camera setup

### 4. Audio Engine Parameters (Lines 20-25)
```python
self.crossfade_time = 0.2      # 200ms crossfade
self.volume_smoothing = 0.15   # Volume interpolation speed
self.max_volume = 0.7          # Maximum volume level
```

**How to adjust:**
- `crossfade_time`: Higher = smoother transitions, but more lag
- `volume_smoothing`: Higher = faster volume changes, lower = smoother
- `max_volume`: 0.0-1.0, adjust based on your speakers

## Calibration Process

### Step 1: Distance Calibration
1. Measure a known distance (e.g., 2 meters)
2. Place a person at that distance
3. Run the detector and note the displayed distance
4. Adjust FOCAL_LENGTH until the displayed distance matches reality

### Step 2: Motion Sensitivity Calibration
1. **Test slow movement:**
   - Move very slowly in front of camera
   - Should show yellow (slow) or green (static)
   - If it shows red (fast), increase STATIC_THRESH and SLOW_THRESH

2. **Test normal movement:**
   - Walk normally in front of camera
   - Should show yellow (slow) or red (fast)
   - If it shows green (static), decrease STATIC_THRESH

3. **Test fast movement:**
   - Move quickly in front of camera
   - Should show red (fast)
   - If it shows yellow (slow), decrease SLOW_THRESH

### Step 3: Fine-tuning
1. Test with different distances
2. Test with different lighting conditions
3. Test with multiple people
4. Adjust parameters based on your specific use case

## Troubleshooting

### Problem: Objects keep getting new IDs
**Solution:** Increase `max_distance` in CentroidTracker

### Problem: Too many false "fast" triggers
**Solution:** Increase `SLOW_THRESH` and `STATIC_THRESH`

### Problem: Not detecting slow movements
**Solution:** Decrease `STATIC_THRESH`

### Problem: Distance readings are wrong
**Solution:** Recalibrate `FOCAL_LENGTH` using the known object method

### Problem: Audio is choppy or delayed
**Solution:** Decrease `crossfade_time` and increase `volume_smoothing`

## Example Configurations

### For Close-up Monitoring (1-2m)
```python
FOCAL_LENGTH = 350
STATIC_THRESH = 10
SLOW_THRESH = 30
```

### For Room Monitoring (2-4m)
```python
FOCAL_LENGTH = 400
STATIC_THRESH = 15
SLOW_THRESH = 50
```

### For Large Space Monitoring (4m+)
```python
FOCAL_LENGTH = 500
STATIC_THRESH = 25
SLOW_THRESH = 80
```

### For High-Resolution Camera (1080p+)
```python
FOCAL_LENGTH = 600
STATIC_THRESH = 30
SLOW_THRESH = 100
```

## Testing Your Calibration

Run this test script to verify your settings:

```python
# Add this to your detector.py for testing
def test_calibration():
    print(f"Current settings:")
    print(f"FOCAL_LENGTH: {FOCAL_LENGTH}")
    print(f"STATIC_THRESH: {STATIC_THRESH}")
    print(f"SLOW_THRESH: {SLOW_THRESH}")
    print(f"Tracker max_distance: {tracker.max_distance}")
    print(f"Audio crossfade: {audio_engine.crossfade_time}s")
    print(f"Audio smoothing: {audio_engine.volume_smoothing}")
    print(f"Max volume: {audio_engine.max_volume}")
```

Remember: The best settings depend on your specific camera, lighting, distance, and use case. Start with the recommended values and adjust based on testing! 