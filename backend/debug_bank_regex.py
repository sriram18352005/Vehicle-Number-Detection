import re

def debug_regex():
    text = """
    STATE BANK OF INDIA
    Account Name: Mr. VEERANGAN R
    Date        : 
    CIF No.     : 85507525181
    IFSC        : SBIN0012795
    """
    marker = "Date"
    text_upper = text.upper()
    
    print(f"Marker: {marker}")
    print(f"Marker in text_upper: {marker.upper() in text_upper}")
    
    pattern = rf"{re.escape(marker)}[:\s]*(.*)"
    match = re.search(pattern, text, re.I)
    
    if match:
        raw_val = match.group(1)
        print(f"Raw group 1: '{raw_val}'")
        line_content = raw_val.split('\n')[0].strip()
        print(f"Line content (after split/strip): '{line_content}'")
        
        # Clean up common separators
        cleaned = re.sub(r'^[:\-\s\t]+', '', line_content).strip()
        print(f"Cleaned content: '{cleaned}'")
        
        if not cleaned:
            print("RESULT: Detected as EMPTY")
        else:
            print("RESULT: Detected as NOT EMPTY")
    else:
        print("RESULT: No match found")

if __name__ == "__main__":
    debug_regex()
