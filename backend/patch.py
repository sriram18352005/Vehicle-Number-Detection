import re

FILE_PATH = "c:/Users/vvsri/OneDrive/Desktop/al authenticator2/backend/app/forensics/bank_logic.py"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

kotak_start = find_line('elif bank_brand == "KOTAK":')
icici_start = find_line('elif bank_brand == "ICICI":')
hdfc_start = find_line('elif bank_brand == "HDFC":')
final_proc = find_line('# Final processing for all bank brands')
remarks_gen = find_line('# 10. Generate Dynamic Remarks')

print(f"KOTAK: {kotak_start}, ICICI: {icici_start}, HDFC: {hdfc_start}, FINAL: {final_proc}, REMARKS: {remarks_gen}")

kotak_block = """        elif bank_brand == "KOTAK":
            # ── 1. Header Validation [HIGH] ───────────────────────────
            has_name = bool(re.search(r'(?i)KOTAK[\\s]*MAHINDRA[\\s]*BANK', text))
            has_stmt = bool(re.search(r'(?i)(account\\s*statement|statement\\s*of\\s*account)', text))
            header_pass_kotak = 1.0 if (has_name and has_stmt) else (0.5 if (has_name or has_stmt) else 0.0)
            checkpoint_results.append({
                "name": "Header Validation", "priority": "HIGH", "weight": 15, "result": header_pass_kotak,
                "reason": "Header identity elements verified" if header_pass_kotak == 1.0 else ("Partial header found" if header_pass_kotak == 0.5 else "Missing header identity"),
                "detected_value": "Kotak Header Found" if header_pass_kotak == 1.0 else ("Partial" if header_pass_kotak == 0.5 else "Not found")
            })

            # ── 2. Account Holder Name [CRITICAL] ─────────────────────
            detected_name_kotak = BankLogic.extract_name_above_address(text_lines, text)
            name_pass_kotak = 1.0 if detected_name_kotak and re.match(r'^[A-Z ]{3,50}$', detected_name_kotak) else 0.0
            checkpoint_results.append({
                "name": "Account Holder Name", "priority": "CRITICAL", "weight": 15, "result": name_pass_kotak,
                "reason": f"Name detected: {detected_name_kotak}" if name_pass_kotak else "Account holder name missing/unclear",
                "detected_value": detected_name_kotak or "Not detected",
                **get_field_info(detected_name_kotak if detected_name_kotak else "CRN")
            })

            # ── 3. Account Number [CRITICAL] ──────────────────────────
            kotak_acc_m = re.search(r'\\b\\d{12,16}\\b', text)
            kotak_acc = kotak_acc_m.group(0) if kotak_acc_m else None
            acc_pass_kotak = 1.0 if kotak_acc else 0.0
            checkpoint_results.append({
                "name": "Account Number", "priority": "CRITICAL", "weight": 15, "result": acc_pass_kotak,
                "reason": f"Account: {kotak_acc}" if acc_pass_kotak else "Valid account number not found",
                "detected_value": kotak_acc or "Not detected",
                **get_field_info(kotak_acc if kotak_acc else "ACCOUNT NO")
            })

            # ── 4. IFSC Code [HIGH] ───────────────────────────────────
            ifsc_m = re.search(r'(?i)KKBK0\\d{6}', text)
            kotak_ifsc = ifsc_m.group(0) if ifsc_m else None
            ifsc_warn = bool(re.search(r'(?i)KKBK[O0]', text)) and not kotak_ifsc
            ifsc_pass_kotak = 1.0 if kotak_ifsc else (0.5 if ifsc_warn else 0.0)
            checkpoint_results.append({
                "name": "IFSC Code", "priority": "HIGH", "weight": 10, "result": ifsc_pass_kotak,
                "reason": f"Valid IFSC: {kotak_ifsc}" if ifsc_pass_kotak == 1.0 else ("Invalid IFSC format" if ifsc_pass_kotak == 0.5 else "IFSC not found"),
                "detected_value": kotak_ifsc or ("Format issue" if ifsc_warn else "Not detected"),
                **get_field_info(kotak_ifsc if kotak_ifsc else "KKBK0")
            })

            # ── 5. Transaction Table Structure [HIGH] ─────────────────
            kotak_cols = ["DATE", "NARRATION", "DEBIT", "CREDIT", "BALANCE"]
            found_kotak_cols = [c for c in kotak_cols if c in text.upper()]
            table_pass_kotak = 1.0 if len(found_kotak_cols) >= 5 else (0.5 if len(found_kotak_cols) >= 3 else 0.0)
            if not transactions: table_pass_kotak = 0.0
            checkpoint_results.append({
                "name": "Transaction Table Structure", "priority": "HIGH", "weight": 10, "result": table_pass_kotak,
                "reason": f"{len(found_kotak_cols)} columns detected" if table_pass_kotak > 0 else "Insufficient columns",
                "detected_value": f"{len(found_kotak_cols)} cols found",
                "bbox": [200, 10, 850, 990], "page": 0
            })

            # ── 6. Date Format Consistency [MEDIUM] ───────────────────
            date_samples = re.findall(r'\\b\\d{2}-[a-zA-Z]{3}-\\d{4}\\b', text)
            other_dates = re.findall(r'\\b\\d{2}[-/]\\d{2}[-/]\\d{4}\\b', text)
            if len(date_samples) > 0 and len(other_dates) == 0:
                date_pass_kotak = 1.0
            elif len(date_samples) > 0 and len(other_dates) > 0:
                date_pass_kotak = 0.5
            else:
                date_pass_kotak = 0.0
            
            if not transactions: date_pass_kotak = 0.0
            checkpoint_results.append({
                "name": "Date Format Consistency", "priority": "MEDIUM", "weight": 10, "result": date_pass_kotak,
                "reason": "Consistent DD-MMM-YYYY format" if date_pass_kotak == 1.0 else ("Mixed date formats" if date_pass_kotak == 0.5 else "Different/No date format"),
                "detected_value": "DD-MMM-YYYY" if date_pass_kotak == 1.0 else ("Mixed" if date_pass_kotak == 0.5 else "Invalid/None"),
                **get_field_info("PERIOD")
            })

            # ── 7. Balance Flow Validation [CRITICAL] ─────────────────
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), None)
            total_mismatch = "TOTAL_MISMATCH" in str(anomalies)
            bal_flow_kotak = 0.0 if total_mismatch else (0.5 if math_anom else 1.0)
            if not transactions: bal_flow_kotak = 0.0
            checkpoint_results.append({
                "name": "Balance Flow Validation", "priority": "CRITICAL", "weight": 20, "result": bal_flow_kotak,
                "reason": "All rows verify (P+C-D=C)" if bal_flow_kotak == 1.0 else ("Minor mismatch" if bal_flow_kotak == 0.5 else "Significant flow mismatch"),
                "detected_value": "Consistent" if bal_flow_kotak == 1.0 else ("Minor error" if bal_flow_kotak == 0.5 else "Failed"),
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]) if math_anom else [250, 700, 800, 980],
                "page": math_anom.get("page", 0) if math_anom else 0
            })

            # ── 8. Transaction Narration Pattern [MEDIUM] ─────────────
            k_banking_kw = ["UPI", "IMPS", "NEFT", "POS", "ATM", "MB", "IB"]
            found_kw_count = 0
            total_rows = len(transactions)
            for tx in transactions:
                desc = str(tx.get('narration','')).upper() + " " + str(tx.get('description','')).upper()
                if any(kw in desc for kw in k_banking_kw):
                    found_kw_count += 1
                    
            if total_rows == 0:
                narr_pass_kotak = 0.0
            elif found_kw_count >= total_rows * 0.5:
                narr_pass_kotak = 1.0
            elif found_kw_count > 0:
                narr_pass_kotak = 0.5
            else:
                narr_pass_kotak = 0.0
                
            checkpoint_results.append({
                "name": "Transaction Narration Pattern", "priority": "MEDIUM", "weight": 5, "result": narr_pass_kotak,
                "reason": "Standard banking keywords found" if narr_pass_kotak == 1.0 else ("Few keywords found" if narr_pass_kotak == 0.5 else "No banking keywords found"),
                "detected_value": f"{found_kw_count}/{total_rows} rows have kw"
            })

            # ── 9. Opening & Closing Balance [HIGH] ───────────────────
            has_ob = bool(re.search(r'(?i)OPENING\\s*BALANCE', text))
            has_cb = bool(re.search(r'(?i)CLOSING\\s*BALANCE', text))
            oc_pass_kotak = 1.0 if (has_ob and has_cb and bal_flow_kotak >= 0.5) else (0.5 if (has_ob and has_cb) else 0.0)
            checkpoint_results.append({
                "name": "Opening & Closing Balance", "priority": "HIGH", "weight": 10, "result": oc_pass_kotak,
                "reason": "Opening & Closing verified" if oc_pass_kotak == 1.0 else ("Values present but math fails/unverified" if oc_pass_kotak == 0.5 else "Missing opening/closing balances"),
                "detected_value": "Verified" if oc_pass_kotak == 1.0 else ("Values found" if oc_pass_kotak == 0.5 else "Missing")
            })

"""

hdfc_block = """        elif bank_brand == "HDFC":
            # ── 1. Header Validation [HIGH] ───────────────────────────
            has_name = bool(re.search(r'(?i)HDFC[\\s]*BANK', text))
            has_stmt = bool(re.search(r'(?i)account\\s*statement', text))
            header_pass_hdfc = 1.0 if (has_name and has_stmt) else (0.5 if (has_name or has_stmt) else 0.0)
            checkpoint_results.append({
                "name": "Header Validation", "priority": "HIGH", "weight": 15, "result": header_pass_hdfc,
                "reason": "Header identity elements verified" if header_pass_hdfc == 1.0 else ("Partial header found" if header_pass_hdfc == 0.5 else "Missing header identity"),
                "detected_value": "HDFC Header Found" if header_pass_hdfc == 1.0 else ("Partial" if header_pass_hdfc == 0.5 else "Not found")
            })

            # ── 2. Account Holder Name [CRITICAL] ─────────────────────
            detected_name_hdfc = BankLogic.extract_name_above_address(text_lines, text)
            name_pass_hdfc = 1.0 if detected_name_hdfc and re.match(r'^[A-Z ]{3,50}$', detected_name_hdfc) else 0.0
            checkpoint_results.append({
                "name": "Account Holder Name", "priority": "CRITICAL", "weight": 15, "result": name_pass_hdfc,
                "reason": f"Name detected: {detected_name_hdfc}" if name_pass_hdfc else "Account holder name missing/unclear",
                "detected_value": detected_name_hdfc or "Not detected",
                **get_field_info(detected_name_hdfc if detected_name_hdfc else "CUSTOMER ID")
            })

            # ── 3. Account Number [CRITICAL] ──────────────────────────
            hdfc_acc_m = re.search(r'\\b\\d{10,14}\\b', text)
            hdfc_acc = hdfc_acc_m.group(0) if hdfc_acc_m else None
            acc_pass_hdfc = 1.0 if hdfc_acc else 0.0
            checkpoint_results.append({
                "name": "Account Number", "priority": "CRITICAL", "weight": 15, "result": acc_pass_hdfc,
                "reason": f"Account: {hdfc_acc}" if acc_pass_hdfc else "Valid account number not found",
                "detected_value": hdfc_acc or "Not detected",
                **get_field_info(hdfc_acc if hdfc_acc else "ACCOUNT NO")
            })

            # ── 4. IFSC Code [HIGH] ───────────────────────────────────
            ifsc_m = re.search(r'(?i)HDFC0[0-9A-Za-z]{6}', text)
            hdfc_ifsc = ifsc_m.group(0) if ifsc_m else None
            ifsc_warn = bool(re.search(r'(?i)HDFC[O0]', text)) and not hdfc_ifsc
            ifsc_pass_hdfc = 1.0 if hdfc_ifsc else (0.5 if ifsc_warn else 0.0)
            checkpoint_results.append({
                "name": "IFSC Code", "priority": "HIGH", "weight": 10, "result": ifsc_pass_hdfc,
                "reason": f"Valid IFSC: {hdfc_ifsc}" if ifsc_pass_hdfc == 1.0 else ("Invalid IFSC format" if ifsc_pass_hdfc == 0.5 else "IFSC not found"),
                "detected_value": hdfc_ifsc or ("Format issue" if ifsc_warn else "Not detected"),
                **get_field_info(hdfc_ifsc if hdfc_ifsc else "IFSC")
            })

            # ── 5. Statement Period [MEDIUM] ──────────────────────────
            period_match = re.search(r'(?i)(?:From|Period)[^\\d]+(\\d{2}.{3}\\d{2,4}).*?(?:To|-)[^\\d]+(\\d{2}.{3}\\d{2,4})', text)
            stmt_per_pass = 1.0 if period_match else (0.5 if re.search(r'(?i)(?:From|Period)', text) else 0.0)
            detected_period = f"{period_match.group(1)} - {period_match.group(2)}" if period_match else None
            checkpoint_results.append({
                "name": "Statement Period", "priority": "MEDIUM", "weight": 5, "result": stmt_per_pass,
                "reason": f"Period: {detected_period}" if stmt_per_pass == 1.0 else ("Partial dates detected" if stmt_per_pass == 0.5 else "Dates missing"),
                "detected_value": detected_period or ("Partial" if stmt_per_pass == 0.5 else "Missing"),
                **get_field_info("PERIOD")
            })

            # ── 6. Transaction Table Structure [HIGH] ─────────────────
            hdfc_cols = ["DATE", "NARRATION", "DEBIT", "CREDIT", "BALANCE"]
            found_hdfc_cols = [c for c in hdfc_cols if c in text.upper()]
            table_pass_hdfc = 1.0 if len(found_hdfc_cols) >= 5 else (0.5 if len(found_hdfc_cols) == 4 else 0.0)
            if not transactions: table_pass_hdfc = 0.0
            checkpoint_results.append({
                "name": "Transaction Table Structure", "priority": "HIGH", "weight": 10, "result": table_pass_hdfc,
                "reason": f"{len(found_hdfc_cols)} columns detected" if table_pass_hdfc > 0 else "Insufficient columns",
                "detected_value": f"{len(found_hdfc_cols)} cols found",
                "bbox": [200, 10, 850, 990], "page": 0
            })

            # ── 7. Date Format Consistency [MEDIUM] ───────────────────
            dfm1 = re.findall(r'\\b\\d{2}/\\d{2}/\\d{4}\\b', text)
            dfm2 = re.findall(r'\\b\\d{2}-\\d{2}-\\d{4}\\b', text)
            if (len(dfm1) > 0 and len(dfm2) == 0) or (len(dfm2) > 0 and len(dfm1) == 0):
                date_pass_hdfc = 1.0
            elif len(dfm1) > 0 and len(dfm2) > 0:
                date_pass_hdfc = 0.5
            else:
                date_pass_hdfc = 0.0
            
            if not transactions: date_pass_hdfc = 0.0
            checkpoint_results.append({
                "name": "Date Format Consistency", "priority": "MEDIUM", "weight": 5, "result": date_pass_hdfc,
                "reason": "Consistent DD/MM/YYYY or DD-MM-YYYY" if date_pass_hdfc == 1.0 else ("Mixed date formats" if date_pass_hdfc == 0.5 else "Different/No format"),
                "detected_value": "Consistent" if date_pass_hdfc == 1.0 else ("Mixed" if date_pass_hdfc == 0.5 else "Invalid/None"),
                "bbox": [100, 10, 900, 100], "page": 0
            })

            # ── 8. Balance Consistency [CRITICAL] ─────────────────────
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), None)
            total_mismatch = "TOTAL_MISMATCH" in str(anomalies)
            bal_flow_hdfc = 0.0 if total_mismatch else (0.5 if math_anom else 1.0)
            if not transactions: bal_flow_hdfc = 0.0
            checkpoint_results.append({
                "name": "Balance Consistency", "priority": "CRITICAL", "weight": 15, "result": bal_flow_hdfc,
                "reason": "All rows verify (P+C-D=C)" if bal_flow_hdfc == 1.0 else ("Minor mismatch" if bal_flow_hdfc == 0.5 else "Significant mismatch"),
                "detected_value": "Consistent" if bal_flow_hdfc == 1.0 else ("Minor error" if bal_flow_hdfc == 0.5 else "Failed"),
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]) if math_anom else [250, 700, 800, 980],
                "page": math_anom.get("page", 0) if math_anom else 0
            })

            # ── 9. Opening & Closing Balance [HIGH] ───────────────────
            has_ob = bool(re.search(r'(?i)OPENING\\s*BALANCE', text))
            has_cb = bool(re.search(r'(?i)CLOSING\\s*BALANCE', text))
            oc_pass_hdfc = 1.0 if (has_ob and has_cb and bal_flow_hdfc >= 0.5) else (0.5 if (has_ob and has_cb) else 0.0)
            checkpoint_results.append({
                "name": "Opening & Closing Balance", "priority": "HIGH", "weight": 10, "result": oc_pass_hdfc,
                "reason": "Opening/Closing balances verify" if oc_pass_hdfc == 1.0 else ("Values present but math fails/unverified" if oc_pass_hdfc == 0.5 else "Missing opening/closing balances"),
                "detected_value": "Verified" if oc_pass_hdfc == 1.0 else ("Values found" if oc_pass_hdfc == 0.5 else "Missing")
            })

"""

final_block = """        # Final processing for all bank brands
        for cp in checkpoint_results:
            if cp.get("result", 0) <= 0: cp["status"] = "FAILED"
            elif cp.get("result", 0) >= 1.0: cp["status"] = "PASSED"
            else: cp["status"] = "WARNING"
            
        fail_count = sum(1 for cp in checkpoint_results if cp["status"] == "FAILED")
        warn_count = sum(1 for cp in checkpoint_results if cp["status"] == "WARNING")
        
        # Rule-Based Classification
        if bank_brand in ["HDFC", "KOTAK"]:
            critical_fails = sum(1 for cp in checkpoint_results if cp.get("priority") == "CRITICAL" and cp["status"] == "FAILED")
            
            if critical_fails > 0:
                final_verdict = "FAKE"
            elif fail_count >= 2:
                final_verdict = "FAKE"
            elif fail_count == 1 or warn_count >= 3:
                final_verdict = "SUSPICIOUS"
            else:
                final_verdict = "REAL"
                
        elif bank_brand == "IOB":
            if processing_status == "INVALID":
                final_verdict = "FAKE"
            else:
                critical_names = ["Header Validation", "Table Detection", "Date Validation", "Balance Check"]
                critical_fails = sum(1 for cp in checkpoint_results if cp["name"] in critical_names and cp["status"] == "FAILED")
                minor_fails = sum(1 for cp in checkpoint_results if cp["name"] not in critical_names and cp["status"] != "PASSED")
                if critical_fails > 0: final_verdict = "FAKE"
                elif minor_fails > 0: final_verdict = "SUSPICIOUS"
                else: final_verdict = "REAL"
                
        elif bank_brand == "ICICI":
            major_names = ["Header Identity Check", "Balance Flow Validation", "Final Balance Reconciliation", "Flexible Table Parsing"]
            major_fails = sum(1 for cp in checkpoint_results if cp["name"] in major_names and cp["status"] == "FAILED")
            if fail_count == 0: final_verdict = "REAL"
            elif major_fails > 0: final_verdict = "FAKE"
            else: final_verdict = "SUSPICIOUS"
            
        else:
            if fail_count == 0: final_verdict = "REAL"
            elif fail_count == 1: final_verdict = "SUSPICIOUS"
            else: final_verdict = "FAKE"
            
        # Final score calculation based on weights for UI granularity
        final_score = 0.0
        for cp in checkpoint_results:
            if "priority" not in cp:
                cp["priority"] = "HIGH" if cp.get("weight", 10) >= 15 else ("CRITICAL" if cp.get("weight") == 20 else "MEDIUM")
                
            contribution = (cp.get("weight", 0) / 100.0) * cp["result"]
            cp["contribution"] = round(contribution * 100, 2)
            
            if "reason" not in cp:
                cp["reason"] = "Validation completed successfully" if cp["status"] == "PASSED" else "Inconsistency detected"
            final_score += contribution

"""

new_lines = lines[:kotak_start] + [kotak_block] + lines[icici_start:hdfc_start] + [hdfc_block] + [final_block] + lines[remarks_gen:]

with open(FILE_PATH, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Patch applied.")
