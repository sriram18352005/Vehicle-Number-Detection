import sys
import os
sys.path.append(os.getcwd())

from app.forensics.fusion import calculate_weighted_score

# Test to verify verdicts match database enum
print("=" * 60)
print("VERDICT ENUM VALIDATION TEST")
print("=" * 60)

# Test 1: High confidence should return "VERIFIED"
result1 = calculate_weighted_score(
    uid_valid=True,
    uid_digits=12,
    dob_valid=True,
    qr_readable=True,
    qr_match=True,
    emblem_present=True,
    logo_present=True,
    header_present=True,
    footer_present=True,
    spelling_correct=True,
    placement_correct=True,
    back_qr_present=True,
    address_order_correct=True,
    footer_has_1947=True,
    footer_has_email=True,
    footer_has_website=True,
    ocr_consistent=True,
    editing_artifacts=False,
    blur_detected=False
)

print(f"High Confidence Test:")
print(f"  Verdict: {result1['verdict']} (Expected: VERIFIED)")
print(f"  Match: {'✓ PASS' if result1['verdict'] == 'VERIFIED' else '✗ FAIL'}")
print()

# Test 2: Low confidence should return "FAKE"
result2 = calculate_weighted_score(
    uid_valid=False,
    uid_digits=11,
    dob_valid=False,
    qr_readable=False,
    qr_match=False,
    emblem_present=False,
    logo_present=False,
    header_present=False,
    footer_present=False,
    spelling_correct=False,
    placement_correct=False,
    back_qr_present=False,
    address_order_correct=False,
    footer_has_1947=False,
    footer_has_email=False,
    footer_has_website=False,
    ocr_consistent=False,
    editing_artifacts=True,
    blur_detected=True
)

print(f"Low Confidence Test:")
print(f"  Verdict: {result2['verdict']} (Expected: FAKE)")
print(f"  Match: {'✓ PASS' if result2['verdict'] == 'FAKE' else '✗ FAIL'}")
print()

# Test 3: Medium confidence should return "SUSPICIOUS"
result3 = calculate_weighted_score(
    uid_valid=True,
    uid_digits=12,
    dob_valid=True,
    qr_readable=True,
    qr_match=True,
    emblem_present=True,
    logo_present=True,
    header_present=False,
    footer_present=True,
    spelling_correct=False,
    placement_correct=True,
    back_qr_present=True,
    address_order_correct=False,
    footer_has_1947=True,
    footer_has_email=True,
    footer_has_website=True,
    ocr_consistent=True,
    editing_artifacts=False,
    blur_detected=True
)

print(f"Medium Confidence Test:")
print(f"  Verdict: {result3['verdict']} (Expected: SUSPICIOUS)")
print(f"  Match: {'✓ PASS' if result3['verdict'] == 'SUSPICIOUS' else '✗ FAIL'}")
print()

# Verify all verdicts are valid enum values
from app.models.document import DocumentVerdict
valid_verdicts = [v.value for v in DocumentVerdict]

print("=" * 60)
print("ENUM VALIDATION")
print("=" * 60)
print(f"Valid database verdicts: {valid_verdicts}")
print()

all_pass = True
for i, result in enumerate([result1, result2, result3], 1):
    verdict = result['verdict']
    is_valid = verdict in valid_verdicts
    print(f"Test {i} verdict '{verdict}': {'✓ VALID' if is_valid else '✗ INVALID'}")
    if not is_valid:
        all_pass = False

print()
print("=" * 60)
if all_pass:
    print("✓ ALL TESTS PASSED - Verdicts match database enum!")
else:
    print("✗ TESTS FAILED - Some verdicts don't match database enum")
print("=" * 60)
