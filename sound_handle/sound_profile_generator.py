import os
import numpy as np
from scipy.io.wavfile import write

def generate_beep(filename, freq, duration, volume, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    wave = (volume * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    write(filename, sample_rate, wave)

def generate_wave_sound(filename, base_freq=440, mod_freq=2, duration=2.0, volume=0.5, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)

    # Carrier sine wave
    carrier = np.sin(2 * np.pi * base_freq * t)

    # Amplitude modulator for wave effect
    modulator = (1 + np.sin(2 * np.pi * mod_freq * t)) / 2  # Range 0 to 1

    wave = (volume * carrier * modulator).astype(np.float32)
    write(filename, sample_rate, wave)

def create_sound_profile(username, sound_type="beep", base_dir="sound_profiles"):
    user_dir = os.path.join(base_dir, username)
    os.makedirs(user_dir, exist_ok=True)

    profile = {
        "fast.wav":   {"freq": 1000, "duration": 0.3, "volume": 0.8},
        "slow.wav":   {"freq": 600,  "duration": 0.5, "volume": 0.6},
        "static.wav": {"freq": 300,  "duration": 0.8, "volume": 0.4}
    }

    for name, cfg in profile.items():
        path = os.path.join(user_dir, name)
        if sound_type == "wave":
            generate_wave_sound(path, base_freq=cfg["freq"], mod_freq=2, duration=cfg["duration"], volume=cfg["volume"])
        else:
            generate_beep(path, **cfg)
        print(f"Generated {path} as {sound_type} sound.")

if __name__ == "__main__":
    username = input("Enter username to create a sound profile: ").strip()
    if not username:
        print("Username cannot be empty.")
        exit()

    sound_type = input("Choose sound type (beep / wave): ").strip().lower()
    if sound_type not in ["beep", "wave"]:
        print("Invalid sound type. Please choose 'beep' or 'wave'.")
        exit()

    create_sound_profile(username, sound_type)