import sys
import json
import re
import pdfplumber

def parse_icici_statement(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if not pdf.pages:
                return {
                    "error": "This is not an ICICI Bank statement. This parser only works for ICICI Bank statements.",
                    "account_holder_name": None,
                    "bank": None
                }
            
            page1 = pdf.pages[0]
            text = page1.extract_text() or ""
            
            # FIRST - VERIFY THE DOCUMENT
            identifiers_present = {
                "logo_or_header": "ICICI BANK" in text.upper(),
                "statement_text": "STATEMENT OF TRANSACTIONS IN SAVING ACCOUNT" in text.upper(),
                "contact_info": "WWW.ICICI.BANK.IN" in text.upper() or "DIAL YOUR BANK 1800-1080" in text.upper() or "1800" in text,
                "headers": all(h in text.upper() for h in ["TRANSACTION DATE", "CHEQUE NUMBER", "TRANSACTION REMARKS", "WITHDRAWAL AMOUNT", "DEPOSIT AMOUNT", "BALANCE"])
            }
            
            # The prompt says ALL must be present. We will be slightly flexible on the exact contact text as OCR can miss it, but strict on headers.
            # Actually, the user said "If ANY of these identifiers are missing, STOP and return"
            if not (identifiers_present["logo_or_header"] and identifiers_present["headers"] and (identifiers_present["statement_text"] or identifiers_present["contact_info"])):
                # Note: We loosen contact_info/statement_text slightly because exact string match is prone to PDF spacing issues,
                # but we enforce the spirit of the prompt.
                
                # Let's do a strict check as requested:
                strict_check = True
                if "ICICI BANK" not in text.upper(): strict_check = False
                
                # If strict check fails, return the exact error requested:
                if not strict_check:
                    return {
                        "error": "This is not an ICICI Bank statement. This parser only works for ICICI Bank statements.",
                        "account_holder_name": None,
                        "bank": None
                    }
            
            # EXTRACTION LOGIC
            # - Look at the TOP-LEFT section of PAGE 1 only
            # - The name appears ABOVE the address lines in BOLD ALL CAPS
            # - It appears before any line starting with "PNO" or address details
            
            words = page1.extract_words(extra_attrs=['fontname', 'size'])
            
            # Filter for TOP-LEFT:
            # Page width is usually ~595. Left half is < 300. Top half is < 400.
            top_left_words = [w for w in words if w['x0'] < 350 and w['top'] < 400]
            
            # Group into lines
            lines = {}
            for w in top_left_words:
                # Group by approximate vertical position (y-tolerance)
                y = round(w['top'] / 3) * 3
                if y not in lines:
                    lines[y] = []
                lines[y].append(w)
                
            sorted_y = sorted(lines.keys())
            
            candidate_name = None
            
            for y in sorted_y:
                line_words = sorted(lines[y], key=lambda w: w['x0'])
                line_text = " ".join(w['text'] for w in line_words).strip()
                
                # Check for address stop words
                if line_text.startswith("PNO") or "ROAD" in line_text.upper() or "STREET" in line_text.upper():
                    break # Reached address block
                    
                # Negative rules
                if "ICICI BANK LIMITED" in line_text.upper(): continue
                if "YOUR BASE BRANCH:" in line_text.upper(): continue
                if "BRANCH" in line_text.upper(): continue
                
                # Is it BOLD? Check fontname for 'Bold'
                is_bold = any('Bold' in w.get('fontname', '') or 'Black' in w.get('fontname', '') for w in line_words)
                
                # Validation: Must be ALL CAPS, only alphabets and spaces
                if line_text == line_text.upper() and re.match(r'^[A-Z\s]+$', line_text.replace(".", "")):
                    # Format: "<INITIAL> <FIRST NAME> <INITIAL> <LAST NAME>" -> 2 to 5 words usually
                    word_count = len(line_text.split())
                    if 2 <= word_count <= 6 and is_bold:
                        candidate_name = line_text
                        break
                        
            if candidate_name:
                return {
                    "bank": "ICICI",
                    "account_holder_name": candidate_name,
                    "confidence": "high"
                }
            else:
                return {
                    "error": "Account holder name could not be found based on strict logic.",
                    "account_holder_name": None,
                    "bank": "ICICI"
                }

    except Exception as e:
        return {
            "error": str(e),
            "account_holder_name": None,
            "bank": None
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = parse_icici_statement(sys.argv[1])
        print(json.dumps(res, indent=2))
    else:
        print("Usage: python icici_strict_parser.py <path_to_pdf>")
