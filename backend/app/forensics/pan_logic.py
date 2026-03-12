import re

class PanVerification:
    @staticmethod
    def verify_pan(ocr_results: dict) -> dict:
        text = ocr_results.get("text", "").upper()
        extracted_data = ocr_results.get("extracted_data", {})
        anomalies = []
        
        pan_number = extracted_data.get("pan_number", "")
        if not pan_number:
            # Fallback to search in text
            match = re.search(r"[A-Z]{5}[0-9]{4}[A-Z]", text)
            if match:
                pan_number = match.group(0)
                extracted_data["pan_number"] = pan_number
        
        if pan_number:
            # 1. Format Check (AAAAA9999A)
            if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan_number):
                anomalies.append({
                    "type": "PAN_FORMAT_ERROR",
                    "message": "PAN Number does not follow AAAAA9999A format.",
                    "severity": "CRITICAL",
                    "indicator": "PAN structure failure"
                })
            
            # 2. Holder Type Check (4th char)
            if len(pan_number) >= 4:
                holder_type = pan_number[3]
                type_map = {
                    'P': 'Individual', 'C': 'Company', 'H': 'HUF', 'A': 'AOP',
                    'B': 'BOI', 'G': 'Government', 'J': 'Artificial Juridical Person',
                    'L': 'Local Authority', 'F': 'Firm/LLP', 'T': 'Trust'
                }
                if holder_type not in type_map:
                    anomalies.append({
                        "type": "PAN_HOLDER_TYPE_ERROR",
                        "message": f"Invalid holder type character '{holder_type}' at 4th position.",
                        "severity": "CRITICAL",
                        "indicator": "PAN data integrity"
                    })
                
                # 3. 5th char check (Last name / Surname initial)
                # In robust validation, we would match this against the extracted name
                # For now, just ensure it's a letter
                if not pan_number[4].isalpha():
                    anomalies.append({
                        "type": "PAN_NAME_INITIAL_ERROR",
                        "message": "5th character of PAN must be alphabet (surname initial).",
                        "severity": "HIGH",
                        "indicator": "PAN structure failure"
                    })
        else:
            anomalies.append({
                "type": "PAN_MISSING",
                "message": "PAN Number not detected or unreadable.",
                "severity": "CRITICAL",
                "indicator": "Missing mandatory field"
            })

        # 3. Visual checks (Signature/Photo)
        if "signature" not in text.lower():
             anomalies.append({
                "type": "PAN_SIGNATURE_WARNING",
                "message": "Signature block not detected. Most PAN cards include a signature.",
                "severity": "WARNING"
            })

        return {"anomalies": anomalies, "extracted_data": extracted_data}
