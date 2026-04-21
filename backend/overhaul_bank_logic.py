import re
import os

FILE_PATH = r"c:\Users\vvsri\OneDrive\Desktop\al authenticator2\backend\app\forensics\bank_logic.py"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new unified pipeline logic
NEW_PIPELINE_LOGIC = """
    @staticmethod
    def calculate_weighted_fraud_score(
        anomalies: list,
        metadata: dict,
        text: str,
        bank_brand: str,
        ocr_results: dict,
        transactions: list,
        master_data: dict = None
    ) -> dict:
        \"\"\"
        Unified 8-checkpoint forensic pipeline for HDFC and Kotak banks.
        \"\"\"
        text_lines = text.split('\\n')
        checkpoint_results = []
        
        # STEP 1 — BANK DETECTION
        detected_brand = "Unknown"
        if re.search(r'(?i)HDFC[\s]*BANK', text):
            detected_brand = "HDFC Bank"
            active_brand = "HDFC"
        elif re.search(r'(?i)KOTAK[\s]*MAHINDRA[\s]*BANK', text):
            detected_brand = "Kotak Mahindra Bank"
            active_brand = "KOTAK"
        else:
            # Rule 1: Bank identity not found
            return {
                "score": 0,
                "verdict": "FAKE",
                "remarks": "Bank identity could not be established from the document header",
                "final_decision": "fake",
                "checkpoints": [],
                "is_checkpoint_based": True,
                "fail_count": 1,
                "bank_brand": "Unknown",
                "immediate_fake": True
            }

        # Parameters for the pipeline
        params = {
            "HDFC": {
                "acc_len": (10, 14),
                "ifsc_pattern": r'(?i)HDFC0[0-9A-Z]{6}',
                "date_formats": [r'\\b\\d{2}/\\d{2}/\\d{4}\\b', r'\\b\\d{2}-\\d{2}-\\d{4}\\b'],
                "required_cols": 4,
                "period_req": True,
                "narration_req": False
            },
            "KOTAK": {
                "acc_len": (12, 16),
                "ifsc_pattern": r'(?i)KKBK0\\d{6}',
                "date_formats": [r'\\b\\d{2}-[a-zA-Z]{3}-\\d{4}\\b'],
                "required_cols": 3,
                "period_req": False,
                "narration_req": True
            }
        }
        p = params[active_brand]

        # STEP 2 — RUN THE VERIFICATION PIPELINE

        # --- CHECKPOINT 1: Header Validation [HIGH] ---
        has_bank = False
        has_stmt = False
        if active_brand == "HDFC":
            has_bank = bool(re.search(r'(?i)HDFC[\s]*BANK', text))
            has_stmt = bool(re.search(r'(?i)Account\s*Statement', text))
        else: # KOTAK
            has_bank = bool(re.search(r'(?i)KOTAK[\s]*MAHINDRA[\s]*BANK', text))
            has_stmt = bool(re.search(r'(?i)Account\s*Statement|Statement\s*(of)?\s*Account', text))
        
        cp1_status = "PASS" if (has_bank and has_stmt) else ("WARN" if has_bank else "FAIL")
        checkpoint_results.append({
            "name": "Header Validation",
            "priority": "HIGH",
            "status": cp1_status,
            "result": 1.0 if cp1_status == "PASS" else (0.5 if cp1_status == "WARN" else 0.0),
            "weight": 10,
            "reason": "Header identity elements verified" if cp1_status == "PASS" else ("Bank name found but statement label missing" if cp1_status == "WARN" else "Bank name is absent from the header"),
            "detected_value": detected_brand
        })

        # --- CHECKPOINT 2: Account Details Block [CRITICAL] ---
        # Sub-check A: Name
        detected_name = BankLogic.extract_name_above_address(text_lines, text)
        sub_a_status = "PASS" if detected_name and re.match(r'^[A-Z\\s.]{3,50}$', detected_name.upper()) else "FAIL"
        
        # Sub-check B: Account Number
        acc_num = metadata.get("account_number") or ""
        if not acc_num:
            acc_match = re.search(r'\\b\\d{' + str(p["acc_len"][0]) + ',' + str(p["acc_len"][1]) + '}\\b', text)
            acc_num = acc_match.group(0) if acc_match else ""
        
        sub_b_status = "FAIL"
        if acc_num and acc_num.isdigit():
            if p["acc_len"][0] <= len(acc_num) <= p["acc_len"][1]:
                sub_b_status = "PASS"
            elif abs(len(acc_num) - p["acc_len"][0]) <= 1 or abs(len(acc_num) - p["acc_len"][1]) <= 1:
                sub_b_status = "WARN"
        
        # Sub-check C: IFSC Code
        ifsc_match = re.search(p["ifsc_pattern"], text)
        ifsc_code = ifsc_match.group(0) if ifsc_match else ""
        sub_c_status = "PASS" if ifsc_code else "FAIL"
        if not ifsc_code:
            # Check for partial or skewed
            if re.search(r'(?i)(HDFC|KKBK)[0O\\s]', text):
                sub_c_status = "WARN"

        # Overall CP2 Status
        cp2_status = "PASS"
        if "FAIL" in [sub_a_status, sub_b_status, sub_c_status]:
            cp2_status = "FAIL"
        elif "WARN" in [sub_a_status, sub_b_status, sub_c_status]:
            cp2_status = "WARN"

        checkpoint_results.append({
            "name": "Account Details Block",
            "priority": "CRITICAL",
            "status": cp2_status,
            "result": 1.0 if cp2_status == "PASS" else (0.5 if cp2_status == "WARN" else 0.0),
            "weight": 20,
            "sub_checks": [
                {"name": "Sub-check A — Account Holder Name", "status": sub_a_status, "detail": detected_name or "Not detected"},
                {"name": "Sub-check B — Account Number", "status": sub_b_status, "detail": f"{acc_num} (Length: {len(acc_num)})" if acc_num else "Not detected"},
                {"name": "Sub-check C — IFSC Code", "status": sub_c_status, "detail": ifsc_code or "Not detected"}
            ],
            "reason": "Account details verified" if cp2_status == "PASS" else "Issues found in account details block",
            "detected_value": acc_num
        })

        # --- STEP 3 RULE 1: IMMEDIATE FAKES ---
        if sub_a_status == "FAIL":
            return BankLogic.finalize_fake(checkpoint_results, "Account Holder Name validation failed (CRITICAL)", detected_brand)
        if sub_b_status == "FAIL":
            return BankLogic.finalize_fake(checkpoint_results, "Account Number validation failed (CRITICAL)", detected_brand)

        # --- CHECKPOINT 3: Statement Period Check [MEDIUM] ---
        cp3_status = "NOT APPLICABLE"
        cp3_detail = f"{active_brand} Bank — not applicable"
        cp3_result = 1.0
        if p["period_req"]:
            period_match = re.search(r'(\\d{2}[-/\\s][A-Za-z0-9]{2,3}[-/\\s]\\d{2,4})\\s*(?:to|to|-)\\s*(\\d{2}[-/\\s][A-Za-z0-9]{2,3}[-/\\s]\\d{2,4})', text)
            if period_match:
                cp3_status = "PASS"
                cp3_detail = f"{period_match.group(1)} - {period_match.group(2)}"
            else:
                if any(kw in text.upper() for kw in ["PERIOD", "FROM", "TO"]):
                    cp3_status = "WARN"
                    cp3_detail = "Period headers found but dates unclear"
                else:
                    cp3_status = "FAIL"
                    cp3_detail = "Statement dates missing"
            cp3_result = 1.0 if cp3_status == "PASS" else (0.5 if cp3_status == "WARN" else 0.0)
        
        checkpoint_results.append({
            "name": "Statement Period Check",
            "priority": "MEDIUM",
            "status": cp3_status,
            "result": cp3_result,
            "weight": 5,
            "detail": cp3_detail,
            "reason": cp3_detail
        })

        # --- CHECKPOINT 4: Transaction Table Structure [HIGH] ---
        cols = ["DATE", "NARRATION", "DEBIT", "CREDIT", "BALANCE"]
        found_cols = [c for c in cols if c in text.upper()]
        cp4_status = "PASS" if len(found_cols) >= p["required_cols"] else ("WARN" if len(found_cols) == p["required_cols"] - 1 else "FAIL")
        if not transactions: cp4_status = "FAIL"
        
        checkpoint_results.append({
            "name": "Transaction Table Structure",
            "priority": "HIGH",
            "status": cp4_status,
            "result": 1.0 if cp4_status == "PASS" else (0.5 if cp4_status == "WARN" else 0.0),
            "weight": 10,
            "detail": f"Columns detected: {', '.join(found_cols)}",
            "reason": f"Detected {len(found_cols)} columns: {', '.join(found_cols)}"
        })

        # --- CHECKPOINT 5: Date Format Consistency [MEDIUM] ---
        format_matches = []
        for fmt in p["date_formats"]:
            format_matches.extend(re.findall(fmt, text))
        
        # Check against other common formats to find mix
        other_formats = [r'\\b\\d{2}/\\d{2}/\\d{4}\\b', r'\\b\\d{2}-\\d{2}-\\d{4}\\b', r'\\b\\d{2}-[a-zA-Z]{3}-\\d{4}\\b']
        mix_count = 0
        for fmt in other_formats:
            if fmt not in p["date_formats"]:
                mix_count += len(re.findall(fmt, text))
        
        if len(format_matches) > 0 and mix_count == 0:
            cp5_status = "PASS"
        elif len(format_matches) > 0 and mix_count <= 2:
            cp5_status = "WARN"
        else:
            cp5_status = "FAIL"
        
        checkpoint_results.append({
            "name": "Date Format Consistency",
            "priority": "MEDIUM",
            "status": cp5_status,
            "result": 1.0 if cp5_status == "PASS" else (0.5 if cp5_status == "WARN" else 0.0),
            "weight": 5,
            "reason": "Date format is consistent" if cp5_status == "PASS" else "Mixed or incorrect date formats detected"
        })

        # --- CHECKPOINT 6: Balance Consistency Check [CRITICAL] ---
        math_anomalies = [a for a in anomalies if a.get("indicator") == "Math Mismatch"]
        if not transactions:
            cp6_status = "FAIL"
            cp6_detail = "No transaction data available for verification"
        elif len(math_anomalies) == 0:
            cp6_status = "PASS"
            cp6_detail = f"Verified {len(transactions)} rows mathematically"
        elif len(math_anomalies) <= 2:
            # Check for ±1 tolerance if it's "minor"
            cp6_status = "WARN"
            cp6_detail = f"Minor discrepancies found in {len(math_anomalies)} rows"
        else:
            cp6_status = "FAIL"
            cp6_detail = f"Significant discrepancies in {len(math_anomalies)} rows"
        
        checkpoint_results.append({
            "name": "Balance Consistency Check",
            "priority": "CRITICAL",
            "status": cp6_status,
            "result": 1.0 if cp6_status == "PASS" else (0.5 if cp6_status == "WARN" else 0.0),
            "weight": 20,
            "detail": cp6_detail,
            "reason": cp6_detail
        })
        
        if cp6_status == "FAIL":
            return BankLogic.finalize_fake(checkpoint_results, "Balance Consistency check failed (CRITICAL)", detected_brand)

        # --- CHECKPOINT 7: Transaction Narration Pattern [MEDIUM] ---
        cp7_status = "NOT APPLICABLE"
        cp7_detail = f"{active_brand} Bank — not applicable"
        cp7_result = 1.0
        if p["narration_req"]:
            kw_pattern = r'(?i)UPI|IMPS|NEFT|POS|ATM|MB|IB'
            match_count = sum(1 for tx in transactions if re.search(kw_pattern, str(tx.get('narration', '')) + " " + str(tx.get('description', ''))))
            if len(transactions) > 0:
                ratio = match_count / len(transactions)
                if ratio >= 0.5: cp7_status = "PASS"
                elif ratio > 0: cp7_status = "WARN"
                else: cp7_status = "FAIL"
            else:
                cp7_status = "FAIL"
            cp7_result = 1.0 if cp7_status == "PASS" else (0.5 if cp7_status == "WARN" else 0.0)
            cp7_detail = f"Keywords found in {match_count}/{len(transactions)} rows"

        checkpoint_results.append({
            "name": "Transaction Narration Pattern",
            "priority": "MEDIUM",
            "status": cp7_status,
            "result": cp7_result,
            "weight": 5,
            "detail": cp7_detail,
            "reason": cp7_detail
        })

        # --- CHECKPOINT 8: Opening and Closing Balance [HIGH] ---
        has_ob = bool(re.search(r'(?i)OPENING\s*BALANCE', text))
        has_cb = bool(re.search(r'(?i)CLOSING\s*BALANCE', text))
        total_mismatch = "TOTAL_MISMATCH" in str(anomalies)
        
        if has_ob and has_cb and not total_mismatch:
            cp8_status = "PASS"
        elif has_ob and has_cb and total_mismatch:
            cp8_status = "WARN"
        else:
            cp8_status = "FAIL"
        
        checkpoint_results.append({
            "name": "Opening and Closing Balance",
            "priority": "HIGH",
            "status": cp8_status,
            "result": 1.0 if cp8_status == "PASS" else (0.5 if cp8_status == "WARN" else 0.0),
            "weight": 15,
            "reason": "Balances verified and equation holds" if cp8_status == "PASS" else "Missing or mismatching summary balances"
        })

        # STEP 3 — SCORING AND VERDICT LOGIC
        fail_count = sum(1 for cp in checkpoint_results if cp["status"] == "FAIL")
        warn_count = sum(1 for cp in checkpoint_results if cp["status"] == "WARN")
        
        # Rule 2: Count-based scoring
        critical_high_pass = all(cp["status"] == "PASS" for cp in checkpoint_results if cp.get("priority") in ["CRITICAL", "HIGH"])
        
        if fail_count == 0 and critical_high_pass:
            final_verdict = "GENUINE"
        elif fail_count == 1:
            # Check if this fail is on a non-critical
            failing_cp = next(cp for cp in checkpoint_results if cp["status"] == "FAIL")
            if failing_cp.get("priority") == "CRITICAL":
                final_verdict = "FAKE" # Should have been caught by Rule 1 but just in case
            else:
                final_verdict = "SUSPICIOUS"
        elif fail_count >= 2:
            final_verdict = "FAKE"
        elif fail_count == 0 and warn_count >= 3:
            final_verdict = "SUSPICIOUS"
        else:
            final_verdict = "GENUINE"

        final_score = sum((cp["weight"] * cp["result"]) for cp in checkpoint_results) / sum(cp["weight"] for cp in checkpoint_results) * 100

        return {
            "score": round(final_score, 2),
            "verdict": final_verdict,
            "remarks": BankLogic.generate_remarks("COMPLETED", checkpoint_results, final_verdict),
            "final_decision": final_verdict.lower(),
            "checkpoints": checkpoint_results,
            "is_checkpoint_based": True,
            "fail_count": fail_count,
            "bank_brand": active_brand
        }

    @staticmethod
    def finalize_fake(checkpoints, reason, brand):
        return {
            "score": 0,
            "verdict": "FAKE",
            "remarks": reason,
            "final_decision": "fake",
            "checkpoints": checkpoints,
            "is_checkpoint_based": True,
            "fail_count": sum(1 for cp in checkpoints if cp["status"] == "FAIL"),
            "bank_brand": brand,
            "immediate_fake": True
        }
"""

# I need to find the old calculate_weighted_fraud_score and finalize_fake and replace them.
# The code is around line 760 to 1600.
# I'll just replace the entire BankLogic class or at least the relevant methods.

import re

# Find the start of calculate_weighted_fraud_score
start_marker = "    @staticmethod\\n    def calculate_weighted_fraud_score"
end_marker = "    @staticmethod\\n    def generate_remarks"

# Find lines using regex
import sys

# Replace the range
new_content = re.sub(r'    @staticmethod\\n    def calculate_weighted_fraud_score\\(.*?    @staticmethod\\n    def generate_remarks', 
                     NEW_PIPELINE_LOGIC + "\\n    @staticmethod\\n    def generate_remarks", 
                     content, flags=re.DOTALL)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Patch applied successfully.")
