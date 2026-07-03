import cv2
import time
import requests
import os
import argparse
from datetime import datetime
from ultralytics import YOLO

# Load configurations
API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:5000/api")
SHOP_ID = int(os.environ.get("RATION_SHOP_ID", "1"))
CHECK_INTERVAL = int(os.environ.get("DETECTION_INTERVAL", "5")) # Seconds

def get_current_working_hours(shop_id):
    """Fetch working hours of the shop from the backend"""
    try:
        res = requests.get(f"{API_URL}/shops/{shop_id}")
        if res.status_code == 200:
            shop_data = res.json().get("shop", {})
            return shop_data.get("working_hours_start"), shop_data.get("working_hours_end")
    except Exception as e:
        print(f"Error fetching shop hours: {e}")
    # Return default 8 AM to 8 PM if request fails
    return "08:00:00", "20:00:00"

def is_within_working_hours(start_str, end_str):
    """Check if current system time is within shop working hours"""
    now = datetime.now().time()
    try:
        start_time = datetime.strptime(start_str, "%H:%M:%S").time()
        end_time = datetime.strptime(end_str, "%H:%M:%S").time()
        return start_time <= now <= end_time
    except ValueError:
        # Fallback if time format varies (e.g. contains subseconds)
        try:
            start_time = datetime.strptime(start_str.split(".")[0], "%H:%M:%S").time()
            end_time = datetime.strptime(end_str.split(".")[0], "%H:%M:%S").time()
            return start_time <= now <= end_time
        except Exception:
            return True # Fallback default

def main():
    parser = argparse.ArgumentParser(description="Smart Crowd Monitoring Person Detector")
    parser.add_argument("--source", type=str, default="0", help="Camera source (0 for webcam, or video path)")
    parser.add_argument("--mock", action="store_true", help="Simulate detections without camera/YOLO model")
    args = parser.parse_args()

    print(f"Initializing Crowd Monitoring Detector for Shop {SHOP_ID}...")
    
    # Initialize YOLOv8 Model (downloads automatically if not present)
    model = None
    cap = None
    if not args.mock:
        print("Loading YOLOv8 Model (yolov8n.pt)...")
        model = YOLO("yolov8n.pt")
        
        # Source can be int (webcam) or str (video file path)
        src = int(args.source) if args.source.isdigit() else args.source
        cap = cv2.VideoCapture(src)
        if not cap.isOpened():
            print(f"Error: Unable to open camera/video source {src}. Switching to mock mode.")
            args.mock = True

    try:
        while True:
            # 1. Fetch current working hours
            start_hours, end_hours = get_current_working_hours(SHOP_ID)
            
            # 2. Check if currently active (8 AM - 8 PM)
            if not is_within_working_hours(start_hours, end_hours):
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Shop Closed. Crowd monitoring disabled.")
                time.sleep(30) # Check again in 30 seconds
                continue

            people_count = 0

            if args.mock:
                # Mock Mode: Simulate changing crowd size (random walk between 0 and 25)
                import random
                people_count = random.randint(0, 25)
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [MOCK] Detected People: {people_count}")
            else:
                ret, frame = cap.read()
                if not ret:
                    # Loop video if it is a file source
                    if isinstance(args.source, str) and args.source != "0":
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    print("Failed to grab frame.")
                    time.sleep(2)
                    continue

                # Run YOLOv8 on frame (predict)
                # Classes: 0 is person in COCO dataset
                results = model.predict(frame, classes=[0], verbose=False)
                
                # We strictly count detections, NO face recognition or biometric features extracted
                people_count = len(results[0].boxes)
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Detected People: {people_count}")

            # 3. Post to API
            try:
                res = requests.post(
                    f"{API_URL}/shops/{SHOP_ID}/crowd",
                    json={"people_count": people_count},
                    timeout=5
                )
                if res.status_code == 200:
                    print(f"Successfully sent update: {res.json()}")
                else:
                    print(f"API Error ({res.status_code}): {res.text}")
            except requests.exceptions.RequestException as e:
                print(f"Failed to connect to API: {e}")

            time.sleep(CHECK_INTERVAL)

    except KeyboardInterrupt:
        print("\nStopping detector...")
    finally:
        if cap:
            cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
