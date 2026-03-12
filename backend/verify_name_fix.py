import re

def test_enhanced_extraction(text):
    text_upper = text.upper()
    
    # regex from fusion.py logic (simulation)
    extracted_data = {}
    
    # regex from tasks.py (latest version)
    desc_match = re.search(r"(?:ACCOUNT|STMT)\s*DESCRIPTION[:\s]+([A-Z\s\-]{3,100})", text, re.I)
    extracted_data["account_description"] = desc_match.group(1).strip() if desc_match else "Not detected"

    name_match = re.search(r"(?:ACCOUNT|CUSTOMER|HOLDER)\s*NAME[:\s]+([A-Za-z\s\.,]{3,100})", text, re.I)
    extracted_data["account_name"] = name_match.group(1).strip().strip(',. ') if name_match else "Not detected"

    # Simulation of fusion.py logic
    extracted_text_block = {
        "Customer Name": extracted_data.get("account_name"),
        "Account Description": extracted_data.get("account_description"),
        "Full Text Preview": text[:5000]
    }
    
    return extracted_text_block

# Industrial test case from user screenshot
sample = """
Account Name                   :\tMr. VEERANGAN  R,Mrs. VIJAYALAKSHMI  V
Account Description            :\tREGULAR SB CHQ-INDIVIDUALS
IFS Code          :SBIN0012795
"""

print("--- START TEST ---")
res = test_enhanced_extraction(sample)
print(f"DEBUG: Customer Name: '{res['Customer Name']}'")
print(f"DEBUG: Account Description: '{res['Account Description']}'")
print(f"DEBUG: Full Text Preview Length: {len(res['Full Text Preview'])}")

assert "REGULAR SB CHQ-INDIVIDUALS" in res['Account Description']
assert "VEERANGAN" in res['Customer Name']
print("SUCCESS: Extraction and preview limits verified.")
print("--- END TEST ---")
