from app.forensics.logo_matcher import LogoMatcher
import os

def test_logo_heuristics():
    matcher = LogoMatcher()
    # Using the test image found in the backend
    sample_path = "test_image.png"
    if not os.path.exists(sample_path):
        print(f"Sample {sample_path} not found.")
        return

    print(f"Testing heuristics on {sample_path}...")
    detections = matcher.find_any_logo(sample_path)
    
    print(f"Found {len(detections)} potential logos:")
    for d in detections:
        print(f"- Label: {d['label']}, Confidence: {d['confidence']}, BBox: {d['bbox']}")

if __name__ == "__main__":
    test_logo_heuristics()
