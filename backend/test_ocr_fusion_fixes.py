"""
Test script to verify OCR and confidence score fixes
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.forensics.ocr_pipeline import perform_ocr
from app.forensics.fusion import fuse_forensic_signals
import math

print("=" * 60)
print("TESTING OCR AND FUSION FIXES")
print("=" * 60)

# Test 1: OCR with valid image (if available)
print("\n[TEST 1] OCR Confidence Validation")
print("-" * 60)

test_image_paths = [
    "storage/uploads",  # Check if any images exist
]

# Find a test image
import glob
test_images = []
for path in test_image_paths:
    if os.path.exists(path):
        test_images.extend(glob.glob(os.path.join(path, "*.jpg")))
        test_images.extend(glob.glob(os.path.join(path, "*.png")))

if test_images:
    test_image = test_images[0]
    print(f"Testing with: {test_image}")
    ocr_result = perform_ocr(test_image)
    
    print(f"✓ OCR Engine: {ocr_result['engine']}")
    print(f"✓ Confidence: {ocr_result['confidence']:.2%}")
    print(f"✓ Text Length: {len(ocr_result['text'])} chars")
    
    # Validate no NaN
    assert ocr_result['confidence'] == ocr_result['confidence'], "FAIL: Confidence is NaN!"
    assert isinstance(ocr_result['confidence'], float), "FAIL: Confidence is not a float!"
    assert 0.0 <= ocr_result['confidence'] <= 1.0, "FAIL: Confidence out of range!"
    
    print("✅ PASS: OCR returns valid confidence")
else:
    print("⚠️  SKIP: No test images found")

# Test 2: Fusion with various inputs including edge cases
print("\n[TEST 2] Fusion Input Validation (NaN Prevention)")
print("-" * 60)

test_cases = [
    {
        "name": "Normal inputs",
        "params": {
            "uid_valid": True,
            "qr_match": True,
            "layout_score": 0.9,
            "ocr_confidence": 0.85,
            "address_valid": True,
            "tamper_score": 0.95,
        }
    },
    {
        "name": "Zero OCR confidence",
        "params": {
            "uid_valid": True,
            "qr_match": True,
            "layout_score": 0.9,
            "ocr_confidence": 0.0,  # Should be handled gracefully
            "address_valid": True,
            "tamper_score": 0.95,
        }
    },
    {
        "name": "NaN OCR confidence (float('nan'))",
        "params": {
            "uid_valid": True,
            "qr_match": True,
            "layout_score": 0.9,
            "ocr_confidence": float('nan'),  # Should be sanitized
            "address_valid": True,
            "tamper_score": 0.95,
        }
    },
    {
        "name": "None values",
        "params": {
            "uid_valid": True,
            "qr_match": True,
            "layout_score": None,  # Should use default
            "ocr_confidence": None,  # Should use default
            "address_valid": True,
            "tamper_score": None,  # Should use default
        }
    },
]

for i, test in enumerate(test_cases, 1):
    print(f"\n  Test {i}: {test['name']}")
    try:
        result = fuse_forensic_signals(**test['params'])
        
        confidence = result['confidence_score']
        verdict = result['verdict']
        
        # Validate output
        assert confidence == confidence, f"FAIL: Confidence is NaN! ({confidence})"
        assert isinstance(confidence, (int, float)), f"FAIL: Confidence is not numeric! ({type(confidence)})"
        assert 0.0 <= confidence <= 1.0, f"FAIL: Confidence out of range! ({confidence})"
        assert verdict in ["VERIFIED", "SUSPICIOUS", "FAKE", "UNKNOWN"], f"FAIL: Invalid verdict! ({verdict})"
        
        print(f"    Verdict: {verdict}")
        print(f"    Confidence: {confidence:.2%}")
        print(f"    ✅ PASS")
    except Exception as e:
        print(f"    ❌ FAIL: {e}")

# Test 3: Breakdown field validation
print("\n[TEST 3] Breakdown Field Validation")
print("-" * 60)

result = fuse_forensic_signals(
    uid_valid=True,
    qr_match=True,
    layout_score=0.9,
    ocr_confidence=0.0,
    address_valid=True,
    tamper_score=0.95,
)

breakdown = result.get('breakdown', {})
required_fields = ['uid_validity', 'qr_cryptographic_match', 'layout_integrity', 
                   'text_consistency', 'geographic_validity', 'forensic_integrity']

print("Checking breakdown fields:")
all_valid = True
for field in required_fields:
    value = breakdown.get(field)
    is_valid = value is not None and value == value and isinstance(value, (int, float))
    status = "✅" if is_valid else "❌"
    print(f"  {status} {field}: {value}")
    if not is_valid:
        all_valid = False

if all_valid:
    print("✅ PASS: All breakdown fields are valid")
else:
    print("❌ FAIL: Some breakdown fields are invalid")

print("\n" + "=" * 60)
print("TESTS COMPLETE")
print("=" * 60)
