import cv2
from sound_player import SoundPlayer

# Initialize sound system
sound_player = SoundPlayer(profile="soundprofil_1")

# Example classification logic (replace with real model/classifier)
def classify_object(obj_label):
    fast_objects = ["car", "bus", "train"]
    slow_objects = ["dog", "person", "human"]
    static_objects = ["bin", "box", "stool", "traffic_light", "stairs"]

    if obj_label in fast_objects:
        return "fast"
    elif obj_label in slow_objects:
        return "slow"
    elif obj_label in static_objects:
        return "static"
    else:
        return None

# Sample loop — replace with real detection
cap = cv2.VideoCapture(0)
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Simulated detection result
    detected_object = "car"  # TODO: Replace with your model's output

    category = classify_object(detected_object)
    if category:
        sound_player.play_sound(category)

    cv2.imshow("Frame", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()