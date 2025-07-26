import os
import numpy as np
from scipy.io.wavfile import write

def generate_beep(filename, freq, duration, volume, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    wave = (volume * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    write(filename, sample_rate, wave)

def create_sound_profile(username, base_dir="sound_profiles"):
    user_dir = os.path.join(base_dir, username)
    os.makedirs(user_dir, exist_ok=True)

    profile = {
        "fast.wav":   {"freq": 1000, "duration": 0.3, "volume": 0.8},
        "slow.wav":   {"freq": 600,  "duration": 0.5, "volume": 0.6},
        "static.wav": {"freq": 300,  "duration": 0.8, "volume": 0.4}
    }

    for name, cfg in profile.items():
        path = os.path.join(user_dir, name)
        generate_beep(path, **cfg)
        print(f"Generated {path}")

if __name__ == "__main__":
    username = input("Enter username to create a sound profile: ").strip()
    if username:
        create_sound_profile(username)
    else:
        print("Username cannot be empty.")