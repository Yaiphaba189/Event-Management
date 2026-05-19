import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.attendance_predictor import AttendancePredictor

print("Initializing Attendance Predictor...")
predictor = AttendancePredictor()

print("Starting training with Manipur University INR contextual pricing data...")
result = predictor.train()

print("Training completed successfully!")
print("Model saved to:", result.get("model_path"))
print("Metrics:")
for metric, val in result.get("metrics", {}).items():
    print(f"  {metric}: {val}")
