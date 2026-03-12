import sys
import os

# Add parent directory to path to import app
sys.path.append(os.getcwd())

from app.forensics.ml_engine import ForensicMLEngine

def test_ml_engine():
    engine = ForensicMLEngine()
    
    # Test 1: Perfect Genuine Case
    genuine_features = {
        "math_consistency": 1.0,
        "ela_mean": 1.2,
        "noise_variance": 400.0,
        "font_std": 2.1,
        "structural_integrity": 1.0,
        "narration_score": 0.95,
        "metadata_trust": 1.0
    }
    
    # Test 2: Blatant Fraud Case
    fraud_features = {
        "math_consistency": 0.0,
        "ela_mean": 6.5,
        "noise_variance": 1800.0,
        "font_std": 14.0,
        "structural_integrity": 0.5,
        "narration_score": 0.3,
        "metadata_trust": 0.0
    }
    
    print("\n--- ML ENGINE DIAGNOSTIC ---")
    
    res1 = engine.predict(genuine_features)
    print(f"GENUINE TEST: Verdict={res1['verdict']}, Confidence={res1['confidence_score']:.4f}")
    
    res2 = engine.predict(fraud_features)
    print(f"FRAUD TEST:   Verdict={res2['verdict']}, Confidence={res2['confidence_score']:.4f}")
    
    if res1['verdict'] == "REAL" and res2['verdict'] == "FAKE":
        print("\n✅ ML Engine logically sound.")
    else:
        print("\n❌ ML Engine logic mismatch.")

if __name__ == "__main__":
    test_ml_engine()
