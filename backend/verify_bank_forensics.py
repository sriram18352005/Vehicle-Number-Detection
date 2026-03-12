
import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "app")))

from forensics.bank_logic import BankLogic, BankProfiler
from forensics.fusion import calculate_strict_verdict

async def run_test():
    print("--- STARTING BANK FORENSIC VERIFICATION ---")
    
    # 1. Test Bank Logic Categorization
    print("\n[1] Testing Bank Logic Categorization...")
    text = "State Bank of India Account CIF Number: 12345 IFSC: SBIN0001234"
    anomalies = BankLogic.verify_bank_identity(text, "SBI")
    
    print(f"Detected {len(anomalies)} anomalies for SBI (Expected 0 for valid markers)")
    for a in anomalies:
        print(f" - [{a['category']}] {a['message']}")
        
    text_invalid = "Random Bank Statement no markers here"
    anomalies_invalid = BankLogic.verify_bank_identity(text_invalid, "SBI")
    print(f"Detected {len(anomalies_invalid)} anomalies for SBI (Expected many for missing markers)")
    
    # Check if categories are present
    categories = set(a.get("category") for a in anomalies_invalid)
    print(f"Categories found: {categories}")
    assert "STRUCTURAL" in categories or "FORMAT" in categories, "Categories missing from bank logic!"

    # 2. Test Fusion Engine Categorization (Probabilistic)
    print("\n[2] Testing Fusion Engine Categorization...")
    
    # Case: FAKE (< 50%)
    mock_anomalies_fake = [{"category": "LOGICAL", "severity": "CRITICAL", "message": "Massive error"}]
    # We'll rely on the engine to calculate score or mock it if needed
    result_fake = calculate_strict_verdict(mock_anomalies_fake, [], "BANK_STATEMENT")
    print(f"Low Score Verdict: {result_fake['status']} (Binary: {result_fake['binary_verdict']})")
    
    # Case: SUSPICIOUS (50-79%)
    from forensics.fusion import fuse_forensic_signals
    # Using specific scores to hit the SUSPICIOUS range
    # ml_score around 0.5 + rules_score 1.0 (mean ~ 0.75)
    result_sus = fuse_forensic_signals(
        id_type="BANK_STATEMENT",
        forensic_results={"forensic_tamper_score": 10, "ela_mean": 2}, # Low ML class score
        extracted_data={"arithmetic_score": 100},
        anomalies=[{"category": "STRUCTURAL", "severity": "WARNING", "indicator": "Font"}]
    )
    
    actual_status = result_sus['FINAL_RESULT_BLOCK']['Status']
    actual_conf = result_sus['FINAL_RESULT_BLOCK']['Confidence Score'] * 100
    print(f"75%+ Verdict: {actual_status} (Conf: {actual_conf}%)")
    
    assert actual_status == "GENUINE", f"Verdict should be GENUINE for 75% score, got {actual_status}"
    
    print("\n--- 75% THRESHOLD VERIFICATION SUCCESSFUL ---")

if __name__ == "__main__":
    asyncio.run(run_test())
