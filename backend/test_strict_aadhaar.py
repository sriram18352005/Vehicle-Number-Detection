import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("."))

from app.forensics.aadhaar_logic import AadhaarVerification
from app.forensics.fusion import fuse_forensic_signals

def test_aadhaar_logic():
    print("--- Testing Strict Aadhaar Logic ---")
    
    # CASE 1: Perfect Front Doc
    ocr_front = {"text": "Aadhaar\nRavi Kumar\nDOB: 01/01/1995\nMale\n1234 1234 1234", "confidence": 0.9}
    res_front = AadhaarVerification.verify_front_structure(ocr_front)
    print(f"Front Perfect: {res_front['is_valid']}, Anomalies: {len(res_front['anomalies'])}")
    
    # CASE 2: Invalid Name
    ocr_name_err = {"text": "Aadhaar\nR4vi Kum4r\nDOB: 01/01/1995\nMale\n1234 1234 1234", "confidence": 0.9}
    res_name = AadhaarVerification.verify_front_structure(ocr_name_err)
    print(f"Invalid Name Detected: {not res_name['is_valid']}, Reason: {res_name['anomalies'][0]['message'] if res_name['anomalies'] else 'None'}")

    # CASE 3: Future DOB
    ocr_dob_err = {"text": "Aadhaar\nRavi Kumar\nDOB: 01/01/2030\nMale\n1234 1234 1234", "confidence": 0.9}
    res_dob = AadhaarVerification.verify_front_structure(ocr_dob_err)
    print(f"Future DOB Detected: {not res_dob['is_valid']}, Reason: {res_dob['anomalies'][0]['message']}")

    # CASE 4: Perfect Back Doc
    ocr_back = {"text": "Address: 123 Main St, Chennai, 600001\n1947\nhelp@uidai.gov.in\nwww.uidai.gov.in", "confidence": 0.9}
    res_back = AadhaarVerification.verify_back_structure(ocr_back, symbol_results=[{"label": "QR_CODE"}])
    print(f"Back Perfect: {res_back['is_valid']}, Anomalies: {len(res_back['anomalies'])}")

    # CASE 5: Fusion Check
    fusion = fuse_forensic_signals(
        uid_valid=True,
        qr_match=True,
        anomalies=[{"type": "ERROR: INVALID NAME", "message": "REASON: Invalid name format detected."}]
    )
    print(f"Fusion Verdict (Expected FAKE): {fusion['verdict']}, Reason: {fusion['reason']}")

    fusion_ok = fuse_forensic_signals(
        uid_valid=True,
        qr_match=True,
        anomalies=[]
    )
    print(f"Fusion Verdict (Expected REAL): {fusion_ok['verdict']}, Reason: {fusion_ok['reason']}")

if __name__ == "__main__":
    test_aadhaar_logic()
