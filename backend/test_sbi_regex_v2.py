import re

def test_sbi_detection_v2():
    test_cases = [
        # Standard
        ("Account Number : 20032199973", "20032199973", True),
        ("SBIN0012795", "SBIN0012795", True),
        
        # Spaced out
        ("SBIN 0012795", "SBIN0012795", True),
        ("200 321 999 73", "20032199973", True),
        
        # Mangled labels or no labels
        ("Reference Code: SBIN0012795", "SBIN0012795", True),
        ("Selected Account: 20032199973", "20032199973", True),
        ("IFS CODE:SBIN0012795", "SBIN0012795", True),
        
        # Edge cases
        ("Some text before SBIN0012795 then more text", "SBIN0012795", True),
        ("Random digits 123456 then 20032199973 then more", "20032199973", True),
        
        # Invalid
        ("SBIN001279", "SBIN001279", False), # Too short IFSC
        ("1234567890", "1234567890", False), # Too short Acc No
        ("ABCD0012345", "ABCD0012345", False), # Not SBIN
    ]

    print("Testing Robust SBI Detection Logic (v2)...")
    
    for text, expected, should_pass in test_cases:
        # Step 1: Normalize (like in bank_logic.py)
        normalized_text = re.sub(r'[\s\.\-:]+', '', text.upper())
        
        # Search anywhere for 11-17 digits
        acc_match = re.search(r'\d{11,17}', normalized_text)
        extracted_acc = acc_match.group(0) if acc_match else None
        
        # Search anywhere for SBIN\d{7}
        ifsc_match = re.search(r'SBIN\d{7}', normalized_text)
        extracted_ifsc = ifsc_match.group(0) if ifsc_match else None
        
        extracted = extracted_acc or extracted_ifsc
        is_valid = False
        if extracted_acc and re.match(r"^\d{11,17}$", extracted_acc):
            is_valid = True
        elif extracted_ifsc and re.match(r"^SBIN\d{7}$", extracted_ifsc):
            is_valid = True
            
        status = "PASS" if is_valid == should_pass else "FAIL"
        print(f"[{status}] Input: '{text}' -> Extracted: '{extracted}' | Expected Valid: {should_pass} | Actual Valid: {is_valid}")

if __name__ == "__main__":
    test_sbi_detection_v2()
