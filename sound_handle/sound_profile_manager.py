import os
import numpy as np
from scipy.io.wavfile import write
import pygame

pygame.mixer.init()

PROFILE_DIR = "sound_profiles"

def generate_beep(filename, freq, duration, volume, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    wave = (volume * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    write(filename, sample_rate, wave)

def play_sound(path, volume=0.8):
    if not os.path.exists(path):
        print("File does not exist.")
        return
    sound = pygame.mixer.Sound(path)
    sound.set_volume(volume)
    sound.play()
    pygame.time.wait(int(sound.get_length() * 1000))

def get_user_path(username, sound_name):
    return os.path.join(PROFILE_DIR, username, f"{sound_name}.wav")

def list_beeps(username):
    user_dir = os.path.join(PROFILE_DIR, username)
    if not os.path.exists(user_dir):
        print(" User profile not found.")
        return []
    files = [f.replace(".wav", "") for f in os.listdir(user_dir) if f.endswith(".wav")]
    return files

def manage_profile(username):
    os.makedirs(os.path.join(PROFILE_DIR, username), exist_ok=True)

    while True:
        print("\n Sound Profile Manager")
        print("1. List current beeps")
        print("2. Play a beep")
        print("3. Change volume")
        print("4. Regenerate beep (change tone/intensity)")
        print("5. Add new beep")
        print("6. Delete a beep")
        print("7. Exit")
        choice = input("Select option: ").strip()

        if choice == "1":
            beeps = list_beeps(username)
            print("Beeps:", beeps)

        elif choice == "2":
            name = input("Enter beep name (e.g. fast, slow): ").strip()
            path = get_user_path(username, name)
            play_sound(path)

        elif choice == "3":
            name = input("Enter beep name: ").strip()
            volume = float(input("Enter new volume (0.0 - 1.0): ").strip())
            path = get_user_path(username, name)
            play_sound(path, volume)

        elif choice == "4":
            name = input("Beep name to regenerate: ").strip()
            freq = int(input("Frequency (Hz): "))
            duration = float(input("Duration (s): "))
            volume = float(input("Volume (0.0 - 1.0): "))
            path = get_user_path(username, name)
            generate_beep(path, freq, duration, volume)
            print(f"Regenerated {name}.wav")

        elif choice == "5":
            name = input("New beep name: ").strip()
            if name in list_beeps(username):
                print("Beep already exists.")
                continue
            freq = int(input("Frequency (Hz): "))
            duration = float(input("Duration (s): "))
            volume = float(input("Volume (0.0 - 1.0): "))
            path = get_user_path(username, name)
            generate_beep(path, freq, duration, volume)
            print(f"Added {name}.wav")

        elif choice == "6":
            name = input("Beep name to delete: ").strip()
            path = get_user_path(username, name)
            if os.path.exists(path):
                os.remove(path)
                print(f"Deleted {name}.wav")
            else:
                print("File not found.")

        elif choice == "7":
            print("Exiting sound manager.")
            break

        else:
            print("Invalid option. Try again.")

if __name__ == "__main__":
    username = input("Enter your username: ").strip()
    if username:
        manage_profile(username)
    else:
        print("Username cannot be empty.")