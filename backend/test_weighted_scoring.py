import sys
import os
sys.path.append(os.getcwd())

from app.forensics.fusion import calculate_weighted_score

# Test Case 1: Genuine Document
print("=" * 60)
print("TEST 1: GENUINE DOCUMENT")
print("=" * 60)
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
print(f"Result: {result1['verdict']}")
print(f"Confidence Score: {result1['confidence_percentage']}%")
print(f"Detected Issues: {result1['detected_issues'] or 'None'}")
print()

# Test Case 2: Likely Fake (from your example)
print("=" * 60)
print("TEST 2: LIKELY FAKE (Your Example)")
print("=" * 60)
result2 = calculate_weighted_score(
    uid_valid=False,
    uid_digits=11,  # Not 12 digits
    dob_valid=False,  # Invalid DOB
    qr_readable=False,  # QR unreadable
    qr_match=False,
    emblem_present=True,
    logo_present=True,
    header_present=True,
    footer_present=True,
    spelling_correct=True,
    placement_correct=True,
    back_qr_present=True,
    address_order_correct=True,
    footer_has_1947=True,
    footer_has_email=False,  # Email incorrect
    footer_has_website=True,
    ocr_consistent=False,  # OCR mismatch
    editing_artifacts=False,
    blur_detected=False
)
print(f"Result: {result2['verdict']}")
print(f"Confidence Score: {result2['confidence_percentage']}%")
print(f"\nDetected Issues:")
for issue in result2['detected_issues']:
    print(f"  - {issue}")
print()

# Test Case 3: Suspicious (Manual Review)
print("=" * 60)
print("TEST 3: SUSPICIOUS (Manual Review Needed)")
print("=" * 60)
result3 = calculate_weighted_score(
    uid_valid=True,
    uid_digits=12,
    dob_valid=True,
    qr_readable=True,
    qr_match=True,
    emblem_present=True,
    logo_present=True,
    header_present=False,  # Missing header
    footer_present=True,
    spelling_correct=False,  # Spelling mistakes
    placement_correct=True,
    back_qr_present=True,
    address_order_correct=False,  # Wrong address order
    footer_has_1947=True,
    footer_has_email=True,
    footer_has_website=True,
    ocr_consistent=True,
    editing_artifacts=False,
    blur_detected=True  # Blur detected
)
print(f"Result: {result3['verdict']}")
print(f"Confidence Score: {result3['confidence_percentage']}%")
print(f"\nDetected Issues:")
for issue in result3['detected_issues']:
    print(f"  - {issue}")
print()

print("=" * 60)
print("PENALTY BREAKDOWN (Test 2)")
print("=" * 60)
breakdown = result2['breakdown']
print(f"Critical Penalties: -{breakdown['critical_penalties']}")
print(f"Structural Penalties: -{breakdown['structural_penalties']}")
print(f"Back-Side Penalties: -{breakdown['backside_penalties']}")
print(f"Tampering Penalties: -{breakdown['tampering_penalties']}")
print(f"Total Penalties: -{breakdown['total_penalties']}")
print(f"Final Score: {breakdown['final_score']}/100")
