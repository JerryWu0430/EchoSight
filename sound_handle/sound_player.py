from sound_storage import SoundStorage

class UserSoundPlayer:
    def __init__(self, username):
        self.storage = SoundStorage(username)
        self.storage.load_sounds()

    def play_sound(self, object_label):
        object_map = {
            "car": "fast", "bus": "fast", "train": "fast",
            "dog": "slow", "person": "slow", "human": "slow",
            "bin": "static", "stairs": "static", "box": "static"
        }

        category = object_map.get(object_label.lower())
        if not category:
            print(f"Unknown object: {object_label}")
            return

        sound = self.storage.get_sound(category)
        if sound:
            sound.play()
            print(f"🔊 Playing {category} for {object_label}")
        else:
            print(f"No sound loaded for category: {category}")

if __name__ == "__main__":
    username = input("Enter your username: ").strip()
    if not username:
        print("Username is required.")
    else:
        player = UserSoundPlayer(username)

        while True:
            obj = input("Detected object (type 'exit' to quit): ").strip()
            if obj.lower() == "exit":
                break
            player.play_sound(obj)