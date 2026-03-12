from app.forensics.bank_logic import BankProfiler

def test_identify_bank():
    # Scenario: ICICI statement with IOB transaction
    icici_sample = """
    ICICI BANK LTD.
    BRANCH: MUMBAI
    CUSTOMER ID: 12345
    IFS Code : ICIC0000123
    
    Transactions:
    10 Jan 2026  TRANSFER TO IOB ACCOUNT  IOBA0001234  -500.00
    """
    
    # Scenario: IOB statement
    iob_sample = """
    INDIAN OVERSEAS BANK
    Account Statement
    IFS Code : IOBA0009999
    """
    
    samples = [
        ("ICICI Statement (Transaction has IOB)", icici_sample),
        ("IOB Statement", iob_sample)
    ]
    
    for desc, text in samples:
        print(f"Testing: {desc}")
        result = BankProfiler.identify_bank(text)
        print(f"Detected: {result}")
        print("-" * 20)

if __name__ == "__main__":
    test_identify_bank()
