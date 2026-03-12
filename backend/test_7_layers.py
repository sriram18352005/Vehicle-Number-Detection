import asyncio
from app.forensics.bank_logic import BankLogic
from app.forensics.fusion import calculate_strict_verdict
from datetime import datetime, timedelta

async def test_7_layer_logic():
    print("--- 7-Layer Forensic Logic Verification ---")
    
    # Mock Data Setup
    mock_metadata = {
        "software_forgery_detected": False,
        "is_searchable": True,
        "producer": "Adobe PDF Library",
        "creator": "Bank Core Export"
    }
    
    # Mock OCR results
    mock_ocr = {
        "text": "SBI STATEMENT ACCOUNT NO 12345678901234567 IFSC SBIN0001234",
        "raw_data": []
    }
    
    # Mock Transactions (Genuine)
    base_date = datetime.now()
    mock_txs = [
        {"date_obj": base_date - timedelta(days=2), "credit": 1000, "debit": 0, "balance": 1000, "narration": "Salary"},
        {"date_obj": base_date - timedelta(days=1), "credit": 0, "debit": 200, "balance": 800, "narration": "Groceries"}
    ]
    
    print("\nScenario 1: Likely Genuine Document (0 Anomalies)")
    anomalies = await BankLogic.verify_7_layers(mock_ocr, mock_txs, mock_metadata, "SBI")
    verdict = calculate_strict_verdict(anomalies, [], "BANK_STATEMENT")
    print(f"Anomalies Found: {len(anomalies)}")
    print(f"Final Status: {verdict['status']}")
    print(f"Expected Status: GENUINE")

    # Scenario 2: Suspicious (2-3 Anomalies)
    print("\nScenario 2: Suspicious Document (2 Anomalies: Math + Metadata Tool)")
    suspicious_metadata = mock_metadata.copy()
    suspicious_metadata["software_forgery_detected"] = True
    suspicious_metadata["suspicious_tool"] = "Photoshop"
    
    # Math mismatch in txs
    suspicious_txs = mock_txs.copy()
    suspicious_txs[1] = {"date_obj": base_date - timedelta(days=1), "credit": 0, "debit": 200, "balance": 999, "narration": "Groceries"}
    
    anomalies = await BankLogic.verify_7_layers(mock_ocr, suspicious_txs, suspicious_metadata, "SBI")
    verdict = calculate_strict_verdict(anomalies, [], "BANK_STATEMENT")
    print(f"Anomalies Found: {len(anomalies)}")
    for a in anomalies: print(f" - {a['message']}")
    print(f"Final Status: {verdict['status']}")
    print(f"Expected Status: SUSPICIOUS")

    # Scenario 3: High Probability of Tampering (4+ Anomalies)
    print("\nScenario 3: Tampered Document (4+ Anomalies: Metadata + Math + Sequence + Rasterized)")
    tampered_metadata = suspicious_metadata.copy()
    tampered_metadata["is_searchable"] = False # Rasterized
    
    # Sequence anomaly (future date)
    tampered_txs = suspicious_txs.copy()
    tampered_txs.append({"date_obj": base_date + timedelta(days=10), "credit": 500, "debit": 0, "balance": 1499, "narration": "Future Work"})
    
    # Account inconsistency
    tampered_ocr = mock_ocr.copy()
    tampered_ocr["text"] += " ACCOUNT NO 99999999999999999"
    
    anomalies = await BankLogic.verify_7_layers(tampered_ocr, tampered_txs, tampered_metadata, "SBI")
    verdict = calculate_strict_verdict(anomalies, [], "BANK_STATEMENT")
    print(f"Anomalies Found: {len(anomalies)}")
    for a in anomalies: print(f" - {a['message']}")
    print(f"Final Status: {verdict['status']}")
    print(f"Expected Status: LIKELY FORGED")

if __name__ == "__main__":
    asyncio.run(test_7_layer_logic())
