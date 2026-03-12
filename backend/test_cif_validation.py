from app.forensics.bank_logic import BankProfiler, BankLogic
import re

def test_bank_forensics():
    test_cases = [
        {
            "bank": "SBI",
            "text": "STATE BANK OF INDIA\nCIF NO: 12345678901\nBranch Code: 1234\nAccount Number: 11223344556677889\nIFSC: SBIN0001234\nAccount Name: Ramesh Kumar",
            "should_have_anomaly": False
        },
        {
            "bank": "SBI",
            "text": "STATE BANK OF INDIA\nCIF Number: 1234567A901\nBranch Code: 1234\nAccount Number: 11223344556677889\nIFSC: SBIN0001234\nStatement of Account\nAccount Name: Ramesh Kumar\nDate: 01-01-2024",
            "should_have_anomaly": True,
            "anomaly_type": "INVALID_CIF_FORMAT"
        },
        {
            "bank": "HDFC",
            "text": "HDFC BANK\nCustomer ID: 123456789\nAccount Number: 50100123456789\nIFSC: HDFC0000123\nRegistered Address: Mumbai, India\nStatement Period: Jan 2024\nEmail ID: test@hdfc.com",
            "should_have_anomaly": False
        },
        {
            "bank": "AXIS",
            "text": "AXIS BANK\nCIF: 123456789\nAccount Number: 912010123456789\nIFSC: UTIB0000123",
            "should_have_anomaly": False
        },
        {
            "bank": "SBI",
            "text": "STATE BANK OF INDIA\nCIF NO: 12345678901 ACCOUNT NO: 11223344556677889\nBranch Code: 1234\nIFSC: SBIN0001234\nAccount Name: Ramesh Kumar",
            "should_have_anomaly": False
        },
        {
            "bank": "HDFC",
            "text": "HDFC BANK\nCustomer ID: 123456789\nAccount Number: 5010012345678912\nIFSC: HDFC0000123\nRegistered Address: Mumbai, India\nStatement Period: Jan 2024\nEmail ID: test@hdfc.com",
            "should_have_anomaly": False
        },
        {
            "bank": "PNB",
            "text": "PUNJAB NATIONAL BANK\nCIF: 12345ABC9\nAccount Number: 0123456789012345\nIFSC: PUNB0000123",
            "should_have_anomaly": True,
            "anomaly_type": "INVALID_CIF_FORMAT"
        }
    ]

    import json
    all_results = []
    for case in test_cases:
        anomalies = BankLogic.verify_bank_identity(case['text'], case['bank'])
        found = any(a['type'] == case.get('anomaly_type') for a in anomalies) if case.get('anomaly_type') else False
        all_results.append({
            "bank": case['bank'],
            "text": case['text'],
            "expected_anomaly": case.get('anomaly_type'),
            "found_expected": found,
            "anomalies": anomalies,
            "passed": (case['should_have_anomaly'] and found) or (not case['should_have_anomaly'] and not anomalies)
        })
    
    with open("test_results.json", "w") as f:
        json.dump(all_results, f, indent=2)
    print("Results written to test_results.json")

if __name__ == "__main__":
    test_bank_forensics()
