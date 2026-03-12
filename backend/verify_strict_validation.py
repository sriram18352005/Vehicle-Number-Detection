from app.forensics.bank_logic import BankLogic, BankProfiler
from app.forensics.fusion import fuse_forensic_signals
import asyncio

async def test_strict_empty_field():
    # Scenario: SBI statement with "Date" label but NO value
    text = """
    STATE BANK OF INDIA
    Account Name: Mr. VEERANGAN R
    Date        : 
    CIF No.     : 85507525181
    IFSC        : SBIN0012795
    """
    
    print("--- TESTING EMPTY DATE FIELD ---")
    
    # 1. Identity Verification
    anomalies = BankLogic.verify_bank_identity(text, "SBI")
    print(f"Detected Anomalies: {[a['type'] for a in anomalies]}")
    
    empty_field_detected = any(a['type'] == 'EMPTY_MANDATORY_FIELD' for a in anomalies)
    print(f"Empty Mandatory Field Anomaly: {'YES' if empty_field_detected else 'NO'}")
    
    # 2. Fusion
    res = fuse_forensic_signals(
        uid_valid=True,
        ocr_confidence=0.95,
        anomalies=anomalies,
        checkpoints=[],
        extracted_data={"text": text, "bank_brand": "SBI"},
        id_type="BANK_STATEMENT"
    )
    
    final_result = res['FINAL_RESULT_BLOCK']
    print(f"Final Verdict: {final_result['Verdict']}")
    print(f"Final Status: {final_result['Status']}")
    print(f"Final Confidence: {final_result['Confidence Score']}")
    
    assert empty_field_detected
    assert final_result['Verdict'] in ["SUSPICIOUS", "FAKE"]
    print("SUCCESS: Empty field strictly detected and penalized.")

if __name__ == "__main__":
    asyncio.run(test_strict_empty_field())
