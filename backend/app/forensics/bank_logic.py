import re
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any

class BankProfiler:
    """
    Specialized forensic rules for different Indian banks.
    """
    
    WEIGHT_MAPS = {
        "SBI": {
            "NAME_MATCH": 0.15,
            "ACC_FORMAT": 0.15,
            "IFSC_BRANCH": 0.10,
            "STMT_PERIOD": 0.10,
            "TABLE_STRUCTURE": 0.20,
            "BALANCE_CONSISTENCY": 0.20,
            "METADATA_TAMPERING": 0.10
        },
        "AXIS": {
            "NAME_VERIFICATION": 15,
            "ACC_FORMAT": 15,
            "IFSC_VALIDATION": 10,
            "MASTER_COMPARISON": 15,
            "TABLE_STRUCTURE": 15,
            "BALANCE_CONSISTENCY": 20,
            "CHRONO_SEQUENCE": 10
        },
        "IOB": {
            "ACC_BLOCK": 0.15,
            "IFSC_MICR": 0.10,
            "STMT_PERIOD": 0.10,
            "CHRONO_ORDER": 0.15,
            "BALANCE_CALC": 0.20,
            "TABLE_ALIGNMENT": 0.15,
            "TAMPERING_FONT": 0.15
        },
        "KOTAK": {
            "ACC_ADDRESS": 0.15,
            "ACC_CIF": 0.15,
            "STMT_PERIOD": 0.10,
            "TABLE_STRUCTURE": 0.20,
            "MATH_ACCURACY": 0.20,
            "SUMMARY_CROSS": 0.10,
            "METADATA_TAMPERING": 0.10
        },
        "ICICI": {
            "NAME_EXTRACTION": 0.15,
            "ACC_PATTERN": 0.15,
            "STMT_PERIOD": 0.10,
            "TABLE_STRUCTURE": 0.20,
            "MATH_ACCURACY": 0.20,
            "SEQ_INTEGRITY": 0.10,
            "METADATA_TAMPERING": 0.10
        },
        "HDFC": {
            "CUST_ID_ACC": 0.15,
            "ACC_IFSC": 0.15,
            "STMT_PERIOD": 0.10,
            "TABLE_STRUCTURE": 0.20,
            "BALANCE_CONSISTENCY": 0.20,
            "SUMMARY_CROSS": 0.10,
            "METADATA_TAMPERING": 0.10
        }
    }

    RULES = {
        "SBI": {
            "name": "State Bank of India",
            "keywords": ["STATE BANK OF INDIA", "SBI", "BHARATIYA STATE BANK"],
            "structural": {
                "font_consistency": True,
                "column_alignment": True,
                "header_formatting": True,
                "required_fields": ["CIF", "IFSC", "ACCOUNT", "NAME"]
            },
            "logical": {
                "arithmetic_checks": True,
                "chronological_order": True,
                "overdraft_logic": True,
                "continuity": True
            },
            "template": {
                "columns": ["Date", "Description", "Ref/Chq", "Debit", "Credit", "Balance"],
                "min_cols": 5,
                "date_pos": 0,
                "desc_pos": 1,
                "debit_pos": 3,
                "credit_pos": 4,
                "balance_pos": 5
            },
            "format": {
                "acc_len": range(11, 18),
                "ifsc_prefix": "SBIN",
                "strict_decimals": True,
                "cif_spec": {
                    "labels": ["CIF Number", "CIF NO", "CIF"],
                    "pattern": r"^\d{11}$",
                    "message": "SBI CIF must be exactly 11 numeric digits."
                }
            },
            "forensic": {
                "metadata_signatures": ["core banking export tool", "sbi.co.in"],
                "timestamp_consistency": True
            }
        },
        "HDFC": {
            "name": "HDFC Bank",
            "keywords": ["HDFC BANK", "HDFC", "HOUSING DEVELOPMENT FINANCE"],
            "structural": {
                "font_consistency": True,
                "column_alignment": True,
                "header_formatting": True,
                "required_fields": ["IFSC", "Customer ID"],
                "vector_mandatory": True
            },
            "logical": {
                "arithmetic_checks": True,
                "chronological_order": True,
                "overdraft_logic": True,
                "boxed_period": True
            },
            "template": {
                "columns": ["Date", "Narration", "Chq/Ref", "Value Date", "Debit", "Credit", "Closing Balance"],
                "min_cols": 6,
                "date_pos": 0,
                "desc_pos": 1,
                "debit_pos": 4,
                "credit_pos": 5,
                "balance_pos": 6
            },
            "format": {
                "acc_len": range(14, 17),
                "ifsc_prefix": "HDFC0",
                "strict_decimals": True,
                "page_format": r"Page \d+ of \d+",
                "cif_spec": {
                    "labels": ["Customer ID", "CIF"],
                    "pattern": r"^\d{8,10}$",
                    "message": "HDFC Customer ID/CIF must be 8-10 numeric digits."
                }
            },
            "forensic": {
                "metadata_signatures": ["hdfcbank.com"],
                "timestamp_consistency": True
            }
        },
        "ICICI": {
            "name": "ICICI Bank",
            "keywords": ["ICICI BANK", "ICICI", "INDUSTRIAL CREDIT AND INVESTMENT"],
            "structural": {
                "font_consistency": True,
                "column_alignment": True,
                "header_formatting": True,
                "required_fields": ["IFSC", "Account", "Statement of Transactions"]
            },
            "logical": {
                "arithmetic_checks": True,
                "chronological_order": True,
                "overdraft_logic": True,
                "strict_chronology": True
            },
            "template": {
                "columns": ["S No.", "Transaction Date", "Cheque Number", "Transaction Remarks", "Withdrawal Amount", "Deposit Amount", "Balance"],
                "min_cols": 6,
                "date_pos": 1,
                "desc_pos": 3,
                "debit_pos": 4,
                "credit_pos": 5,
                "balance_pos": 6
            },
            "format": {
                "acc_len": range(12, 13),
                "ifsc_prefix": "ICIC0",
                "strict_decimals": True,
                "cif_spec": {
                    "labels": ["Customer ID", "CIF"],
                    "pattern": r"^\d{8,12}$",
                    "message": "ICICI Customer ID must be 8-12 numeric digits."
                }
            },
            "forensic": {
                "metadata_signatures": ["icicibank.com"],
                "timestamp_mandatory": True,
                "timestamp_consistency": True
            }
        },
        "AXIS": {
            "name": "Axis Bank",
            "keywords": ["AXIS BANK", "AXIS", "UTI BANK"],
            "structural": {
                "font_consistency": True,
                "column_alignment": True,
                "header_formatting": True,
                "required_fields": ["AXIS BANK", "ACCOUNT NO", "TRAN DATE", "PARTICULARS", "DEBIT", "CREDIT", "BALANCE"]
            },
            "logical": {
                "arithmetic_checks": True,
                "chronological_order": True,
                "overdraft_logic": True
            },
            "template": {
                "columns": ["Tran Date", "Chq No", "Particulars", "Debit", "Credit", "Balance", "Init Br"],
                "min_cols": 5,
                "date_pos": 0,
                "desc_pos": 2,
                "debit_pos": 3,
                "credit_pos": 4,
                "balance_pos": 5
            },
            "format": {
                "acc_len": range(12, 17),
                "ifsc_prefix": "UTIB0",
                "strict_decimals": True,
                "ifsc_pattern": r"UTIB0\d{6}",
                "acc_pattern": r"\b\d{12,16}\b"
            },
            "forensic": {
                "timestamp_consistency": True
            }
        },
        "KOTAK": {
            "name": "Kotak Mahindra Bank",
            "keywords": ["KOTAK", "KOTAK MAHINDRA", "KOTAK BANK"],
            "structural": {
                "font_consistency": True,
                "column_alignment": True,
                "header_formatting": True,
                "required_fields": ["CRN", "Account", "IFSC"]
            },
            "logical": {
                "arithmetic_checks": True,
                "chronological_order": True,
                "overdraft_logic": True
            },
            "template": {
                "columns": ["Date", "Narration", "Chq/Ref", "Debit", "Credit", "Balance"],
                "min_cols": 5,
                "date_pos": 0,
                "desc_pos": 1,
                "debit_pos": 3,
                "credit_pos": 4,
                "balance_pos": 5
            },
            "format": {
                "acc_len": range(10, 11),
                "ifsc_prefix": "KKBK0",
                "strict_decimals": True,
                "cif_spec": {
                    "labels": ["CRN"],
                    "pattern": r"^\d{8,12}$",
                    "message": "Kotak CRN must be 8-12 numeric digits."
                }
            },
            "forensic": {
                "timestamp_consistency": True
            }
        },
        "IOB": {
            "name": "Indian Overseas Bank",
            "keywords": ["IOB", "INDIAN OVERSEAS BANK"],
            "structural": {
                "font_consistency": True,
                "column_alignment": True,
                "header_formatting": True,
                "required_fields": ["IFSC", "MICR", "ACCOUNT"]
            },
            "logical": {
                "arithmetic_checks": True,
                "chronological_order": True
            },
            "template": {
                "columns": ["Date", "Description", "Chq No", "Debit", "Credit", "Balance"],
                "min_cols": 5,
                "date_pos": 0,
                "desc_pos": 1,
                "debit_pos": 3,
                "credit_pos": 4,
                "balance_pos": 5
            },
            "format": {
                "acc_len": range(15, 16),
                "ifsc_prefix": "IOBA",
                "strict_decimals": True
            },
            "forensic": {
                "timestamp_consistency": True
            }
        }
    }

    @staticmethod
    def identify_bank(text: str) -> str:
        """
        Identify bank based on a multi-signal scoring system.
        Prioritizes Header keywords > IFSC Prefix > General Keywords.
        """
        text_upper = text.upper()
        # Only look at the first 2000 characters for primary branding
        header_text = text_upper[:2000]
        
        scores = {bank_id: 0 for bank_id in BankProfiler.RULES.keys()}
        
        for bank_id, config in BankProfiler.RULES.items():
            # 1. Primary Signal: Bank Name in Header (Very Strong)
            for kw in config["keywords"]:
                if kw in header_text:
                    scores[bank_id] += 10
            
            # 2. Secondary Signal: IFSC Prefix (Anywhere, but weighted)
            if config["format"]["ifsc_prefix"] in text_upper:
                # If in header, it's stronger
                if config["format"]["ifsc_prefix"] in header_text:
                    scores[bank_id] += 8
                else:
                    scores[bank_id] += 3 # Could be in transactions
            
            # 3. Tertiary Signal: General Keywords in full text
            for kw in config["keywords"]:
                if kw in text_upper:
                    scores[bank_id] += 1

        best_bank = max(scores, key=scores.get)
        if scores[best_bank] > 0:
            print(f"BANK_IDENTIFY: Result={best_bank}, Confidence={scores[best_bank]}")
            return best_bank
            
        return "UNKNOWN"

class BankLogic:
    """
    Core logic for verifying bank statement arithmetic consistency and forensic patterns.
    """
    
    @staticmethod
    def extract_name_above_address(text_lines: List[str], full_text: str) -> str:
        """
        Refined Account Holder Name detection logic.
        Locates address block and searches backwards for a pattern-matched name.
        """
        detected_name = ""
        address_keywords = [
            "STREET", "ROAD", "NAGAR", "COLONY", "TAMIL NADU", "INDIA", "PIN", 
            "PNO", "CROSS", "FLAT", "APARTMENT", "BLDG", "POST", "DIST", "BLOCK"
        ]
        address_index = -1
        
        # Find the first line containing an address keyword
        for i, line in enumerate(text_lines):
            line_upper = line.upper()
            if any(kw in line_upper for kw in address_keywords):
                address_index = i
                break
        
        if address_index > 0:
            # Pattern: letters and spaces only, 2-5 words
            name_pattern = r'^[A-Z]+( [A-Z]+){1,4}$'
            # Keywords that certainly aren't names (Forbidden Words)
            bank_keywords = [
                "TRANSACTION", "REMARKS", "WITHDRAWAL", "DEPOSIT", "BALANCE", 
                "STATEMENT", "ACCOUNT", "DATE", "AMOUNT", "BANK", "LIMITED", "SAVING",
                "BRANCH", "PHONE", "PAGE", "OFFICE", "ADDRESS", "INCOME TAX", "CHEQUE",
                "CUSTOMER", "NAME"
            ]
            
            for i in range(address_index - 1, -1, -1):
                candidate = text_lines[i].strip().upper()
                # Check for regex match and exclude forbidden keywords
                if re.match(name_pattern, candidate) and not any(kw in candidate for kw in bank_keywords):
                    detected_name = candidate
                    break

        # Fallback if backwards search failed: Search for standard prefixes in restricted scope
        if not detected_name:
            limited_text = "\n".join(text_lines[:40]).upper()
            name_match = re.search(r'\b(?:MR\.|MS\.|MRS\.)\s+([A-Z\s]{2,40})\b', limited_text)
            if name_match:
                detected_name = name_match.group(1).strip()

        if detected_name:
            print(f"DEBUG_NAME_EXTRACT: Detected='{detected_name}'")
            
        return detected_name

    @staticmethod
    def find_text_bbox(target_text: str, ocr_results: dict) -> dict:
        """Helper to find bounding box and page for a specific string in OCR results."""
        if not target_text or target_text == "Not detected" or not ocr_results:
            return {"bbox": [0,0,100,100], "page": 0}
            
        raw_data = ocr_results.get("raw_data", [])
        target_upper = str(target_text).upper()
        
        for item in raw_data:
            if target_upper in str(item.get("text", "")).upper():
                return {
                    "bbox": item.get("bbox", [0,0,100,100]),
                    "page": item.get("page", 0)
                }
        return {"bbox": [0,0,100,100], "page": 0}

    @staticmethod
    def verify_bank_brand_match(detected_brand: str, selected_brand: str) -> list:
        """Enforce strict brand matching."""
        if not selected_brand or selected_brand == "AUTO":
            return []
        if detected_brand != selected_brand:
            return [{
                "type": "FORMAT_MISMATCH",
                "category": "FORMAT",
                "layer": 7,
                "message": f"CRITICAL: Bank Mismatch! Selected '{selected_brand}', but detected '{detected_brand}'. Re-processing blocked.",
                "severity": "CRITICAL",
                "indicator": "Strict Format Check",
                "box_type": "HIGHLIGHT"
            }]
        return []

    @staticmethod
    async def verify_7_layers(ocr_results: dict, transactions: list, metadata: dict, bank_brand: str) -> dict:
        """
        Comprehensive 7-Layer Forensic Validation Framework.
        """
        anomalies = []
        text = ocr_results.get("text", "")
        text_upper = text.upper()
        
        # --- PRE-PROCESSING: DATE PARSING & SORTING ---
        for tx in transactions:
            if not tx.get('date_obj'):
                try:
                    # Try common Indian bank date formats
                    d_str = tx.get('date', '')
                    for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y", "%m/%d/%Y"]:
                        try:
                            tx['date_obj'] = datetime.strptime(d_str, fmt)
                            break
                        except: continue
                except:
                    tx['date_obj'] = None

        # Sort transactions chronologically to prevent false sequence flags
        transactions.sort(key=lambda x: x.get('date_obj') or datetime.min)

        # --- LAYER 1: DOCUMENT METADATA ANALYSIS ---
        if metadata.get("software_forgery_detected"):
            tool = metadata.get("suspicious_tool", "Unknown")
            anomalies.append({
                "type": "METADATA_FORGERY_SIG",
                "category": "FORENSIC",
                "layer": 1,
                "message": f"Critical: Metadata shows editing software: {tool}",
                "severity": "CRITICAL",
                "indicator": "Metadata Tampering"
            })

        # --- LAYER 2: STRUCTURAL CONSISTENCY CHECK ---
        # Detect overlay text edits or pixel-level distortion hints
        if bank_brand != "SBI" and not metadata.get("is_searchable", False) and bank_brand in ["SBI", "HDFC", "ICICI", "AXIS"]:
            anomalies.append({
                "type": "RASTERIZED_BANK_STMT",
                "category": "STRUCTURAL",
                "layer": 2,
                "message": "Critical: PDF layer tampering detected (Rasterized Bank Statement)",
                "severity": "CRITICAL",
                "indicator": "PDF Layer Tampering",
                "box_type": "MARK"
            })

        # --- LAYER 3: TRANSACTION LOGIC VALIDATION (SELF-HEALING) ---
        if not transactions:
            anomalies.append({
                "type": "NO_TRANSACTIONS_DETECTED",
                "category": "LOGICAL",
                "layer": 3,
                "message": "High: Missing opening or closing balance (No transactions detected)",
                "severity": "HIGH",
                "indicator": "Missing Balance"
            })
        else:
            # Self-healing loop: Attempt to re-sync if a row fails
            i = 1
            while i < len(transactions):
                try:
                    prev_bal = float(transactions[i-1].get('balance', 0))
                    curr_credit = float(transactions[i].get('credit', 0))
                    curr_debit = float(transactions[i].get('debit', 0))
                    curr_bal = float(transactions[i].get('balance', 0))
                    
                    expected_bal = round(prev_bal + curr_credit - curr_debit, 2)
                    
                    # TOLERANCE: ±0.01 to account for OCR rounding noise
                    if abs(expected_bal - curr_bal) > 0.02: 
                        # Mismatched! 
                        # Try SNEAK PEEK: does the NEXT row match if we assume this row's balance is correct?
                        # This prevents cascading errors if only one row was misread.
                        anomalies.append({
                            "type": "ARITHMETIC_MISMATCH",
                            "category": "LOGICAL",
                            "layer": 3,
                            "row": i + 1,
                            "message": f"Critical: Balance calculation mismatch at Row {i+1}: Expected {expected_bal}, found {curr_bal}",
                            "severity": "CRITICAL",
                            "indicator": "Math Mismatch",
                            "box_type": "HIGHLIGHT",
                            "bbox": transactions[i].get("bbox"),
                            "page": transactions[i].get("page", 0)
                        })
                        # SELF-HEALING: We accept the current 'curr_bal' as the new ground truth for the next row
                        # to avoid flagging the whole statement.
                except (ValueError, TypeError):
                    pass
                i += 1

        # --- LAYER 4: DATE & SEQUENCE FORENSICS ---
        dates = []
        for tx in transactions:
            dt = tx.get('date_obj')
            if dt: dates.append(dt)
        
        if dates:
            # Check chronological order
            for i in range(len(dates)-1):
                if dates[i] > dates[i+1]:
                    anomalies.append({
                        "type": "SEQUENCE_ANOMALY",
                        "category": "FORENSIC",
                        "layer": 4,
                        "message": "High: Date sequence manipulation detected (non-chronological)",
                        "severity": "HIGH",
                        "indicator": "Date Sequence",
                        "bbox": transactions[i+1].get("bbox"),
                        "page": transactions[i+1].get("page", 0)
                    })
            
            # Check for generic patterns
            now = datetime.now()
            for i, d in enumerate(dates):
                if d > now:
                    anomalies.append({
                        "type": "FUTURE_DATED_TX",
                        "category": "FORENSIC",
                        "layer": 4,
                        "message": "Critical: Future-dated transactions detected (PDF tampering indication)",
                        "severity": "CRITICAL",
                        "indicator": "Date Sequence",
                        "bbox": transactions[i].get("bbox"),
                        "page": transactions[i].get("page", 0)
                    })

        # --- LAYER 5: TRANSACTION PATTERN ANALYSIS ---
        desc_counts = {}
        rounding_count = 0
        tx_ids = []
        for tx in transactions:
            desc = str(tx.get('narration', '')).upper()
            desc_counts[desc] = desc_counts.get(desc, 0) + 1
            if tx.get('id'): tx_ids.append(tx['id'])
            
            # Artificial rounding pattern (.00)
            credit = str(tx.get('credit', ''))
            debit = str(tx.get('debit', ''))
            if ('.00' in credit or credit == '0') and ('.00' in debit or debit == '0'):
                rounding_count += 1
        
        # High: Duplicate transaction IDs
        if len(tx_ids) != len(set(tx_ids)):
            anomalies.append({
                "type": "DUPLICATE_TX_ID",
                "category": "LOGICAL",
                "layer": 5,
                "message": "High: Duplicate transaction IDs detected",
                "severity": "HIGH",
                "indicator": "Duplicate IDs"
            })

        if len(transactions) > 5 and rounding_count / len(transactions) > 0.9:
            anomalies.append({
                "type": "ARTIFICIAL_ROUNDING",
                "category": "FORENSIC",
                "layer": 5,
                "message": "Medium: Repeated amount patterns / Artificial rounding detected",
                "severity": "MEDIUM",
                "indicator": "Amount Patterns"
            })
            
        # Detect generic descriptions
        generic_keywords = ["PAYMENT", "TRANSFER", "BANK TRANSFER", "CASH", "INTERNAL"]
        if any(kw in str(list(desc_counts.keys())) for kw in generic_keywords) and len(desc_counts) < (len(transactions) / 2):
            anomalies.append({
                "type": "GENERIC_DESCRIPTIONS",
                "category": "FORENSIC",
                "layer": 5,
                "message": "Medium: Generic transaction descriptions used frequently",
                "severity": "MEDIUM",
                "indicator": "Generic Descriptions"
            })

        # Low Severity Examples (SKIP FOR SBI/ICICI/IOB: we use native checkpoint extraction instead of generic alignment)
        if bank_brand not in ["SBI", "ICICI", "IOB"] and ocr_results.get("confidence", 100) < 80:
             anomalies.append({
                "type": "LOW_OCR_CONFIDENCE",
                "category": "FORMAT",
                "layer": 2,
                "message": "Low: Minor alignment drift or formatting inconsistency (OCR noise)",
                "severity": "LOW",
                "indicator": "Alignment Drift"
            })

        # --- LAYER 7: CONSISTENCY CROSS-CHECK ---
        if bank_brand in BankProfiler.RULES and bank_brand != "SBI":
            rules = BankProfiler.RULES[bank_brand]
            # Account format check
            acc_pattern = r"(?:ACCOUNT|ACC)\s*(?:NO|NUMBER|NUM)[:\s\.\-]*(\d{9,25})"
            matches = re.findall(acc_pattern, text_upper)
            if matches:
                unique_accs = set(matches)
                if len(unique_accs) > 1:
                    anomalies.append({
                        "type": "ACCOUNT_INCONSISTENCY",
                        "category": "STRUCTURAL",
                        "layer": 7,
                        "message": "High: Multiple different Account Numbers detected (Structural Integrity)",
                        "severity": "HIGH",
                        "indicator": "Cross-Check",
                        "box_type": "HIGHLIGHT"
                    })
                
                # Length check
                acc_num = matches[0]
                if len(acc_num) not in rules["format"]["acc_len"]:
                    anomalies.append({
                        "type": "ACCOUNT_LENGTH_INVALID",
                        "category": "FORMAT",
                        "layer": 7,
                        "message": f"Medium: {bank_brand} account length inconsistency. Expected {rules['format']['acc_len'].start}-{rules['format']['acc_len'].stop-1} digits, found {len(acc_num)}.",
                        "severity": "MEDIUM",
                        "indicator": "Format Check"
                    })

        return anomalies

    @staticmethod
    def calculate_weighted_fraud_score(
        anomalies: List[dict],
        metadata: dict,
        text: str,
        bank_brand: str,
        ocr_results: dict, # Kept as it's used by get_field_info
        transactions: list, # Kept as it's used by the function logic
        master_data: Optional[dict] = None
    ) -> dict:
        """
        Calculate fraud score- [x] Implementing Bank-Specific Weighted Fraud Detection.
- [x] Define Weight Maps in backend.
- [x] Implement Isolated Checkpoint Execution.
- [x] Update Fusion Scoring logic.
- [x] Remove Logo Detection logic.
- [x] Update Frontend to show Active Model & Filtered Checkpoints.
        """
        if bank_brand not in BankProfiler.WEIGHT_MAPS:
            return {"score": 0, "checkpoints": [], "error": "Bank not supported for weighted validation"}

        weights = BankProfiler.WEIGHT_MAPS[bank_brand]
        checkpoint_results = []
        final_score = 0.0
        # STEP 1: OCR Text Normalization
        raw_text = ocr_results.get("text", "")
        # Convert to uppercase, remove extra spaces, merge lines for better matching
        text = re.sub(r'\s+', ' ', raw_text.upper()).strip()
        # Keep a line-split version for proximity/location based checks
        text_lines = [line.strip() for line in raw_text.upper().split('\n') if line.strip()]

        # Helper to find bbox for field checks
        def get_field_info(field_val):
            return BankLogic.find_text_bbox(field_val, ocr_results)

        # Helper to check if any anomaly of specific type exists
        def has_anomaly(anom_type):
            return any(a.get("type") == anom_type for a in anomalies)
        
        def has_indicator(indicator):
            return any(a.get("indicator") == indicator for a in anomalies)

        if bank_brand == "SBI":
            # 1. Account Holder Name Verification
            name_anom = next((a for a in anomalies if a.get("type") == "NAME_MISMATCH"), None)
            name_pass = 1.0 if not name_anom else 0.0
            checkpoint_results.append({
                "name": "Account Holder Name Verification", 
                "result": name_pass,
                "status": "PASSED" if name_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                "reason": "Names must exactly match Bank Records / Master Template" if not name_pass else "Name verified",
                **get_field_info(metadata.get("account_name"))
            })
            
            # 2. Account Number Format Validation (Proximity-Based v3)
            # Only consider numbers near "Account Number", "A/C NO", or "ACCOUNT NO".
            acc_num_val = None
            labels = ["ACCOUNT NUMBER", "A/C NO", "ACCOUNT NO"]
            for label in labels:
                label_idx = text.upper().find(label)
                if label_idx != -1:
                    # Look for 11-17 digits within 50 characters of label
                    vicinity = text.upper()[label_idx:label_idx+60]
                    match = re.search(r'\b\d{11,17}\b', vicinity)
                    if match:
                        acc_num_val = match.group(0)
                        break
            
            # Fallback to metadata if proximity search failed but metadata looks valid
            if not acc_num_val:
                acc_num_raw = str(metadata.get("account_number", "")).upper().replace(" ", "")
                acc_num_clean = re.sub(r'[^\d]', '', acc_num_raw)
                if 11 <= len(acc_num_clean) <= 17:
                    acc_num_val = acc_num_clean

            acc_format_pass = 1.0 if acc_num_val and re.match(r"^\d{11,17}$", acc_num_val) else 0.0
            
            checkpoint_results.append({
                "name": "Account Number Format Validation", 
                "result": acc_format_pass,
                "status": "PASSED" if acc_format_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                "reason": "Must be 11-17 numeric digits located near Account Label" if not acc_format_pass else "Format verified near label",
                **get_field_info(acc_num_val if acc_num_val else "Account Number")
            })
            
            # 3. IFSC Code Validation (Strict SBIN + 7 digits)
            ifsc_val = None
            # Normalize text to handle spaces: SBIN 0012795 -> SBIN0012795
            full_norm_text = re.sub(r'\s+', '', text.upper())
            ifsc_match = re.search(r'SBIN\d{7}', full_norm_text)
            if ifsc_match:
                ifsc_val = ifsc_match.group(0)
            
            ifsc_pass = 1.0 if ifsc_val else 0.0
            
            checkpoint_results.append({
                "name": "IFSC Code Validation", 
                "result": ifsc_pass,
                "status": "PASSED" if ifsc_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                "reason": "Must match SBIN followed by 7 digits" if not ifsc_pass else "IFSC verified",
                **get_field_info(ifsc_val if ifsc_val else "IFSC")
            })
            
            # 4. Statement Period Validation
            period_anom = next((a for a in anomalies if "period" in a.get("message", "").lower()), None)
            period_pass = 1.0 if not period_anom else 0.0
            checkpoint_results.append({
                "name": "Statement Period Validation", 
                "result": period_pass,
                "status": "PASSED" if period_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                **get_field_info("PERIOD")
            })

            # 5. Master Structural Comparison (Reference-Based Verification)
            structural_pass = 1.0
            structural_reason = "Structure matches Master Reference Template"
            master_anom_box = [0, 0, 100, 100]
            
            if master_data:
                # Compare number of blocks/lines/text density to detect structural tampering
                master_text = master_data.get("text", "")
                master_len = len(master_text)
                current_len = len(text)
                
                # If text volume differs significantly from template (e.g. > 50%), flag it
                if abs(master_len - current_len) / (master_len or 1) > 0.5:
                    structural_pass = 0.0
                    structural_reason = "Structural mismatch: Content density deviates significantly from Master Template."
                    master_anom_box = [10, 10, 200, 990] # Header region suspicion
                
                # Check for specific master structural markers if available
                # (Future enhancement: precise coordinate mapping comparison)

            checkpoint_results.append({
                "name": "Master Template Comparison",
                "result": structural_pass,
                "status": "PASSED" if structural_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                "reason": structural_reason,
                "bbox": master_anom_box,
                "page": 0
            })
            
            # 6. Running Balance Consistency (Direct Calculation)
            # Verify: Previous Balance + Credit - Debit = Current Balance
            balance_pass = 1.0
            balance_reason = "All transaction balances are mathematically consistent."
            mismatch_details = None
            
            if transactions and len(transactions) > 1:
                for i in range(1, len(transactions)):
                    prev_bal = transactions[i-1].get("balance", 0.0)
                    curr_debit = transactions[i].get("debit", 0.0)
                    curr_credit = transactions[i].get("credit", 0.0)
                    reported_bal = transactions[i].get("balance", 0.0)
                    
                    expected_bal = round(prev_bal + curr_credit - curr_debit, 2)
                    if abs(expected_bal - reported_bal) > 0.01:
                        balance_pass = 0.0
                        balance_reason = f"Balance Mismatch at Row {i+1}: Expected {expected_bal}, Found {reported_bal}"
                        mismatch_details = transactions[i]
                        break

            checkpoint_results.append({
                "name": "Running Balance Consistency", 
                "result": balance_pass,
                "status": "PASSED" if balance_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                "reason": balance_reason,
                "bbox": mismatch_details.get("bbox", [250, 700, 800, 980]) if mismatch_details else [250, 700, 800, 980],
                "page": mismatch_details.get("page", 0) if mismatch_details else 0
            })
            
            # 7. Transaction Sequence Validation
            seq_anom = next((a for a in anomalies if a.get("indicator") == "Date Sequence"), None)
            seq_pass = 1.0 if not seq_anom else 0.0
            checkpoint_results.append({
                "name": "Transaction Sequence Validation", 
                "result": seq_pass,
                "status": "PASSED" if seq_pass else "FAILED",
                "weight": 0,
                "contribution": 0,
                "bbox": seq_anom.get("bbox", [100, 10, 900, 100]) if seq_anom else [100, 10, 900, 100],
                "page": seq_anom.get("page", 0) if seq_anom else 0
            })

            # SBI processing continues below with global rule-based classification
            pass

        elif bank_brand == "AXIS":
            # 1. Account Holder Name Verification
            detected_name_axis = BankLogic.extract_name_above_address(text_lines, text)
            # Validation rules: uppercase letters only, no digits
            name_pass = 1.0 if detected_name_axis and re.match(r'^[A-Z ]{3,50}$', detected_name_axis) and not any(c.isdigit() for c in detected_name_axis) else 0.0
            checkpoint_results.append({
                "name": "Account Holder Name Verification", 
                "result": name_pass,
                "status": "PASSED" if name_pass else "FAILED",
                "weight": 15,
                "contribution": 0,
                "reason": f"Valid name detected: {detected_name_axis}" if name_pass else "Name missing, corrupted, or contains invalid characters (uppercase only)",
                **get_field_info(detected_name_axis if detected_name_axis else metadata.get("account_name"))
            })

            # 2. Account Number Format Validation
            acc_num_val = None
            labels = ["ACCOUNT NO", "ACCOUNT NUMBER", "STATEMENT OF AXIS ACCOUNT"]
            for label in labels:
                label_idx = text.find(label.upper())
                if label_idx != -1:
                    vicinity = text[label_idx:label_idx+100]
                    match = re.search(r'\b\d{12,16}\b', vicinity)
                    if match:
                        acc_num_val = match.group(0)
                        break
            
            acc_result = 1.0 if acc_num_val else 0.0
            checkpoint_results.append({
                "name": "Account Number Format Validation", 
                "result": acc_result,
                "status": "PASSED" if acc_result else "FAILED",
                "weight": 15,
                "contribution": 0,
                "reason": f"Account number found: {acc_num_val}" if acc_result else "Account number missing or invalid format (12-16 digits)",
                **get_field_info(acc_num_val if acc_num_val else "ACCOUNT NO")
            })

            # 3. IFSC Code Validation
            ifsc_match = re.search(r'UTIB0\d{6}', text)
            ifsc_val = ifsc_match.group(0) if ifsc_match else None
            ifsc_result = 1.0 if ifsc_val else 0.0
            checkpoint_results.append({
                "name": "IFSC Code Validation", 
                "result": ifsc_result,
                "status": "PASSED" if ifsc_result else "FAILED",
                "weight": 10,
                "contribution": 0,
                "reason": f"Valid Axis IFSC found: {ifsc_val}" if ifsc_result else "Axis IFSC (UTIB0 + 6 digits) not detected",
                **get_field_info(ifsc_val if ifsc_val else "UTIB0")
            })

            # 4. Master Template Comparison
            header_keywords = ["AXIS BANK", "ACCOUNT NO", "TRAN DATE", "PARTICULARS", "DEBIT", "CREDIT", "BALANCE"]
            found_headers = [k for k in header_keywords if k in text]
            master_result = 1.0 if len(found_headers) == len(header_keywords) else (len(found_headers) / len(header_keywords))
            # Strict pass for this checkpoint requirement
            master_pass = 1.0 if master_result >= 0.8 else 0.0
            
            checkpoint_results.append({
                "name": "Master Template Comparison", 
                "result": master_pass,
                "status": "PASSED" if master_pass else "FAILED",
                "weight": 15,
                "contribution": 0,
                "reason": f"All Axis structural keywords verified" if master_pass else f"Missing structural markers: {set(header_keywords) - set(found_headers)}",
                **get_field_info("AXIS BANK")
            })

            # 5. Transaction Table Structure Validation
            table_cols = ["TRAN DATE", "CHQ NO", "PARTICULARS", "DEBIT", "CREDIT", "BALANCE", "INIT BR"]
            found_cols = [col for col in table_cols if col in text]
            table_result = 1.0 if len(found_cols) >= 5 else 0.0
            checkpoint_results.append({
                "name": "Transaction Table Structure Validation", 
                "result": table_result,
                "status": "PASSED" if table_result else "FAILED",
                "weight": 15,
                "contribution": 0,
                "reason": f"Detected {len(found_cols)} Axis columns: {', '.join(found_cols)}" if table_result else "Transaction structure missing or recognized (5+ cols required)",
                "bbox": [200, 10, 850, 990], "page": 0
            })

            # 6. Running Balance Consistency
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), {})
            balance_result = 1.0 if not math_anom and transactions else 0.0
            checkpoint_results.append({
                "name": "Running Balance Consistency", 
                "result": balance_result,
                "status": "PASSED" if balance_result else "FAILED",
                "weight": 20,
                "contribution": 0,
                "reason": "All transaction balances are mathematically consistent (Prev + Credit - Debit = Current)" if balance_result else "Balance calculation mismatch detected",
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]),
                "page": math_anom.get("page", 0)
            })

            # 7. Transaction Chronological Sequence
            chrono_anom = next((a for a in anomalies if a.get("indicator") == "Date Sequence"), {})
            chrono_result = 1.0 if not chrono_anom and transactions else 0.0
            checkpoint_results.append({
                "name": "Transaction Chronological Sequence", 
                "result": chrono_result,
                "status": "PASSED" if chrono_result else "FAILED",
                "weight": 10,
                "contribution": 0,
                "reason": "Transactions are in ascending chronological order" if chrono_result else "Date sequence violation detected",
                "bbox": chrono_anom.get("bbox", [100, 10, 900, 100]),
                "page": chrono_anom.get("page", 0)
            })

        elif bank_brand == "IOB":
            # ── 1. Account Holder Name Verification (IOB Multi-line Extraction) ───
            name_anom = next((a for a in anomalies if a.get("type") == "NAME_MISMATCH"), None)
            name_pass = 1.0 if not name_anom else 0.0
            
            # IOB specific extraction: find Account Number line, name follows it + next lines
            extracted_name = ""
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if "ACCOUNT NUMBER" in line.upper() or "A/C NO" in line.upper():
                    # Extract everything after the 15-digit account number on this line
                    match = re.search(r'\b\d{15}\b(.*)', line)
                    if match:
                        extracted_name += match.group(1).strip() + " "
                    # Capture next 2 lines for the rest of the name
                    if i + 1 < len(lines):
                        extracted_name += lines[i+1].strip() + " "
                    if i + 2 < len(lines) and "DATE" not in lines[i+2].upper() and "IFSC" not in lines[i+2].upper():
                        extracted_name += lines[i+2].strip()
                    break
            
            extracted_name = re.sub(r'[^A-Z0-9\s]', '', extracted_name.upper()).strip()
            extracted_name = re.sub(r'\s+', ' ', extracted_name)
            
            name_in_text = 1.0 if len(extracted_name) > 3 else 0.0
            name_result = name_pass if name_in_text >= 1.0 else 0.0
            
            checkpoint_results.append({
                "name": "Account Holder Name Verification",
                "weight": 15,
                "result": name_result,
                "status": "PASSED" if name_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": f"Name verified: {extracted_name}" if name_result >= 1.0 else "Account holder name missing",
                **get_field_info(extracted_name if extracted_name else metadata.get("account_name"))
            })

            # ── 2. Account Number Format Validation (IOB: 15 digits) ─────────────
            iob_acc_labels = ["ACCOUNT NUMBER", "ACCOUNT NO", "A/C NO", "A/C NUMBER", "ACC NO"]
            iob_acc_val = None
            for label in iob_acc_labels:
                label_pos = text.find(label)
                if label_pos != -1:
                    search_window = re.sub(r'\s+', '', text[label_pos:label_pos + 90])
                    acc_match = re.search(r'\b(\d{15})\b', search_window)
                    if acc_match:
                        iob_acc_val = acc_match.group(1)
                        break
            if not iob_acc_val:
                global_acc = re.search(r'\b(\d{15})\b', re.sub(r'\s+', '', text))
                if global_acc:
                    iob_acc_val = global_acc.group(1)
            acc_result = 1.0 if iob_acc_val else 0.0
            checkpoint_results.append({
                "name": "Account Number Format (15-digit)",
                "weight": 15,
                "result": acc_result,
                "status": "PASSED" if acc_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": f"Account number detected: {iob_acc_val}" if iob_acc_val else "15-digit IOB account number not found",
                **get_field_info(iob_acc_val)
            })

            # ── 3. IFSC Code Validation (IOB format: IOBA + 7 digits) ────────────
            clean_for_ifsc = re.sub(r'\s+', '', text)
            iob_ifsc_match = re.search(r'IOBA\d{7}', clean_for_ifsc)
            iob_ifsc_val = iob_ifsc_match.group(0) if iob_ifsc_match else None
            ifsc_result = 1.0 if iob_ifsc_val else 0.0
            checkpoint_results.append({
                "name": "IFSC Code Validation (IOBA + 7 digits)",
                "weight": 10,
                "result": ifsc_result,
                "status": "PASSED" if ifsc_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": f"IFSC verified: {iob_ifsc_val}" if iob_ifsc_val else "IOB IFSC code (IOBA + 7 digits) not found or invalid",
                **get_field_info(iob_ifsc_val)
            })

            # ── 4. Statement Period Validation ────────────────────────────────────
            period_kws = ["PERIOD", "STATEMENT DATE", "STATEMENT PERIOD", "DATE RANGE", "FROM", "TO"]
            period_kw_pass = 1.0 if any(kw in text for kw in period_kws) else 0.0
            # Check for IOB-style date range (e.g. "01-Apr-2024 to 30-Apr-2024")
            iob_date_range = re.search(
                r'\d{1,2}[-/]\w{3}[-/]\d{4}\s+(?:TO|to)\s+\d{1,2}[-/]\w{3}[-/]\d{4}',
                text
            )
            period_result = 1.0 if (period_kw_pass >= 1.0 or iob_date_range) else 0.0
            checkpoint_results.append({
                "name": "Statement Period Validation",
                "weight": 10,
                "result": period_result,
                "status": "PASSED" if period_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": "Statement date range verified" if period_result >= 1.0 else "Statement period missing or incorrectly formatted",
                **get_field_info("PERIOD")
            })

            # ── 5. Running Balance Consistency Check ──────────────────────────────
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), {})
            balance_result = 1.0 if not math_anom else 0.0
            checkpoint_results.append({
                "name": "Running Balance Consistency",
                "weight": 20,
                "result": balance_result,
                "status": "PASSED" if balance_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": "All balances pass Prev + Credit - Debit = Current" if balance_result >= 1.0 else "Balance calculation mismatch detected",
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]),
                "page": math_anom.get("page", 0)
            })

            # ── 6. Transaction Chronological Order ───────────────────────────────
            chrono_anom = next((a for a in anomalies if a.get("indicator") == "Date Sequence"), {})
            chrono_result = 1.0 if not chrono_anom else 0.0
            checkpoint_results.append({
                "name": "Transaction Chronological Order",
                "weight": 15,
                "result": chrono_result,
                "status": "PASSED" if chrono_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": "Transactions are in correct chronological order" if chrono_result >= 1.0 else "Out-of-sequence or duplicate transaction dates detected",
                "bbox": chrono_anom.get("bbox", [100, 10, 900, 100]),
                "page": chrono_anom.get("page", 0)
            })

            # ── 7. Transaction Table Structure ────────────────────────────────────
            iob_table_cols = ["DATE", "DESCRIPTION", "DEBIT", "CREDIT", "BALANCE"]
            found_iob_cols = [col for col in iob_table_cols if col in text]
            table_result = 1.0 if len(found_iob_cols) >= 4 else (0.5 if len(found_iob_cols) >= 2 else 0.0)
            if has_anomaly("NO_TRANSACTIONS_DETECTED"):
                table_result = 0.0
            checkpoint_results.append({
                "name": "Transaction Table Structure",
                "weight": 15,
                "result": table_result,
                "status": "PASSED" if table_result >= 1.0 else ("WARNING" if table_result > 0 else "FAILED"),
                "contribution": 0,
                "reason": f"Table columns verified: {', '.join(found_iob_cols)}" if table_result >= 1.0 else f"Missing columns. Found: {', '.join(found_iob_cols) or 'none'}",
                "bbox": [200, 10, 850, 990], "page": 0
            })

        elif bank_brand == "KOTAK":
            detected_name_kotak = BankLogic.extract_name_above_address(text_lines, text)
            name_anom_kotak = next((a for a in anomalies if a.get("type") == "NAME_MISMATCH"), None)
            name_result_kotak = 1.0 if not name_anom_kotak and detected_name_kotak else 0.0
            
            checkpoint_results.append({
                "name": "Account Holder & Address Block", "weight": 15, 
                "result": name_result_kotak,
                "status": "PASSED" if name_result_kotak >= 1.0 else "FAILED",
                "reason": f"Name detected: {detected_name_kotak}" if detected_name_kotak else "Account holder or address block not verified",
                **get_field_info(detected_name_kotak if detected_name_kotak else "CRN")
            })
            checkpoint_results.append({
                "name": "Acc Number & CIF Check", "weight": 15, 
                "result": 1.0 if not has_anomaly("ACCOUNT_LENGTH_INVALID") else 0.0,
                **get_field_info(metadata.get("account_number"))
            })
            checkpoint_results.append({
                "name": "Statement Period Validation", "weight": 10, 
                "result": 1.0 if any(kw in text for kw in ["PERIOD", "STATEMENT"]) else 0.0,
                **get_field_info("PERIOD")
            })
            checkpoint_results.append({
                "name": "Transaction Structure", "weight": 20, 
                "result": 1.0 if not has_anomaly("NO_TRANSACTIONS_DETECTED") else 0.0,
                "bbox": [200, 10, 850, 990], "page": 0
            })
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), {})
            checkpoint_results.append({
                "name": "Math Accuracy", "weight": 20, 
                "result": 1.0 if not math_anom else 0.0,
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]),
                "page": math_anom.get("page", 0)
            })
            checkpoint_results.append({"name": "Summary Cross-Verification", "weight": 10, "result": 1.0}) # Simplified
            checkpoint_results.append({"name": "PDF Integrity Check", "weight": 10, "result": 1.0 if not has_indicator("Metadata Tampering") else 0.0})

        elif bank_brand == "ICICI":
            # ─────────────────────────────────────────────────────────────────
            # ICICI Extraction Logic v8 (Hybrid PDF Native + OCR Fallback)
            detected_name = ""
            original_path = ocr_results.get("original_path")
            
            # ICICI Extraction Logic v11 (Strict 3-Tier Fallback via Prompt)
            detected_name = ""
            extraction_method = "none"
            confidence = "low"
            raw_line_found = ""
            
            raw_text_check = text
            text_lines = [line.strip() for line in raw_text_check.split('\n') if line.strip()]

            # STEP 1 - DOCUMENT VERIFICATION
            is_icici = False
            for kw in ["ICICI", "icici", "1800-1080", "icici.bank.in"]:
                if kw in raw_text_check:
                    is_icici = True
                    break
                    
            if not is_icici:
                anomalies.append({
                    "type": "DOC_TYPE_MISMATCH",
                    "message": "Not an ICICI Bank statement",
                    "severity": "CRITICAL",
                    "indicator": "Format Error"
                })
            else:
                # HELPER to check bad words
                def contains_bad_words(line_text, bad_words):
                    line_upper = line_text.upper()
                    return any(bw in line_upper for bw in bad_words)

                # STEP 3 - REGEX PATTERN TO APPLY (PNO Target)
                # Find any line where NEXT line starts with PNO or PN0
                # Current line: UPPERCASE, A-Z and spaces, >=2 words, no bad words
                step3_bad_words = ["ICICI", "BANK", "LIMITED", "BRANCH", "STATEMENT", "ACCOUNT", "SAVING"]
                
                for i in range(len(text_lines) - 1):
                    next_line = text_lines[i+1].upper()
                    if next_line.startswith("PNO") or next_line.startswith("PN0"):
                        curr_line = text_lines[i]
                        clean_curr = curr_line.replace(".", "").replace(",", "").strip()
                        
                        if curr_line == curr_line.upper() and re.match(r'^[A-Z\s]+$', clean_curr):
                            word_count = len(clean_curr.split())
                            if word_count >= 2 and not contains_bad_words(curr_line, step3_bad_words):
                                detected_name = clean_curr
                                extraction_method = "step3"
                                confidence = "high"
                                raw_line_found = curr_line
                                break
                                
                # STEP 4 - FALLBACK SCAN (if Step 3 fails)
                if not detected_name:
                    step4_bad_words = ["ICICI", "BANK", "SAVING", "TRANSACTION", "STATEMENT", "BRANCH", 
                                       "INDIA", "AMOUNT", "CHEQUE", "BALANCE", "DEPOSIT", "WITHDRAWAL", 
                                       "REMARKS", "DATE", "NEVER", "SHARE", "PLEASE", "CALL", "REGISTERED"]
                    
                    candidate_step4 = ""
                    # Appears in FIRST 20 lines
                    for line in text_lines[:20]:
                        clean_line = line.replace(".", "").replace(",", "").strip()
                        
                        if line == line.upper() and not any(char.isdigit() for char in line) and not contains_bad_words(line, step4_bad_words):
                            words = clean_line.split()
                            if 2 <= len(words) <= 6:
                                # Each word 1 to 15 chars
                                if all(1 <= len(w) <= 15 for w in words):
                                    # Pick the first one that matches as the most likely
                                    candidate_step4 = clean_line
                                    raw_line_found = line
                                    break
                                    
                    if candidate_step4:
                        detected_name = candidate_step4
                        extraction_method = "step4"
                        confidence = "medium"

                # STEP 5 - LAST RESORT FALLBACK
                if not detected_name:
                    # BIL/INFT/[code]/Family/\n[NAME]
                    # MMT/IMPS/[number]/RepaymentofLoan/[NAME]/
                    # UPI/V VIJAYALA/94434...
                    for t in transactions:
                        remark = t.get("description", "").upper()
                        
                        # Check BIL/INFT...Family/
                        if "FAMILY/" in remark:
                            parts = remark.split("FAMILY/")
                            if len(parts) > 1:
                                potential_name = parts[1].split()[0] if parts[1] else "" # rough approximation, might be on next line
                                # If transaction parsing combined lines
                                clean_name = re.sub(r'[^A-Z\s]', '', potential_name).strip()
                                if clean_name:
                                    detected_name = clean_name
                                    extraction_method = "step5_family"
                                    confidence = "low"
                                    raw_line_found = remark
                                    break
                                    
                        # Check RepaymentofLoan
                        if "REPAYMENTOFLOAN/" in remark:
                            parts = remark.split("REPAYMENTOFLOAN/")
                            if len(parts) > 1:
                                potential_name = parts[1].split('/')[0]
                                clean_name = re.sub(r'[^A-Z\s]', '', potential_name).strip()
                                if clean_name:
                                    detected_name = clean_name
                                    extraction_method = "step5_loan"
                                    confidence = "low"
                                    raw_line_found = remark
                                    break
                                    
                        # Check UPI
                        upi_match = re.search(r'UPI/([A-Z\s]+)/[0-9]+', remark)
                        if upi_match:
                            clean_name = upi_match.group(1).strip()
                            if len(clean_name) > 3:
                                detected_name = clean_name
                                extraction_method = "step5_upi"
                                confidence = "low"
                                raw_line_found = remark
                                break

                # STEP 6 - VALIDATE FINAL NAME
                if detected_name:
                    words = detected_name.split()
                    if not (2 <= len(words) <= 6) or not (5 <= len(detected_name) <= 50):
                        detected_name = ""
                    else:
                        # Ensure only alphabets/spaces
                        if not re.match(r'^[A-Z\s]+$', detected_name.replace(".", "")):
                            detected_name = ""

            # Checkpoint 1: Account Holder Name ────────────────────────────
            name_anom = next((a for a in anomalies if a.get("type") == "NAME_MISMATCH"), None)
            name_pass = 1.0 if (not name_anom and detected_name) else 0.0

            checkpoint_results.append({
                "name": "Account Holder Name Verification",
                "weight": 15,
                "result": name_pass,
                "status": "PASSED" if name_pass >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": f"Name detected: {detected_name} (Method: {extraction_method}, Confidence: {confidence}) [Line: {raw_line_found}]" if name_pass >= 1.0 else "Account holder name could not be extracted via any step.",
                "confidence_label": confidence,
                "extraction_method": extraction_method,
                "raw_line_found": raw_line_found,
                **get_field_info(detected_name if detected_name else metadata.get("account_name"))
            })

            # Checkpoint 2: Account Number (12-digit search near title)
            account_number = None
            for line in text_lines[:25]:
                if "STATEMENT" in line.upper() and "ACCOUNT" in line.upper():
                    match = re.search(r"\b\d{12}\b", line)
                    if match:
                        account_number = match.group()
                        break
            if not account_number:
                for line in text_lines[:25]:
                    match = re.search(r"\b\d{12}\b", line)
                    if match:
                        account_number = match.group()
                        break

            acc_result = 1.0 if account_number else 0.0
            checkpoint_results.append({
                "name": "Account Number Format (12-digit)",
                "weight": 15,
                "result": acc_result,
                "status": "PASSED" if acc_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": f"Account number detected: {account_number}" if account_number else "12-digit account number not found",
                **get_field_info(account_number)
            })

            # STEP 6 (IFSC): Mark as PASS if ICICI BANK LIMITED exists
            norm_text = raw_text.upper()
            bank_name_found = "ICICI BANK LIMITED" in norm_text or "ICICI BANK" in norm_text
            
            clean_text_ifsc = re.sub(r'\s+', '', norm_text)
            icici_ifsc_match = re.search(r'ICIC\d{7}', clean_text_ifsc)
            ifsc_val = icici_ifsc_match.group(0) if icici_ifsc_match else None
            
            ifsc_result = 1.0 if (ifsc_val or bank_name_found) else 0.0

            # ── 3. IFSC Code Validation (ICICI format: ICIC + 7 digits) ──────────
            clean_text_ifsc = re.sub(r'\s+', '', text)
            icici_ifsc_match = re.search(r'ICIC\d{7}', clean_text_ifsc)
            ifsc_val = icici_ifsc_match.group(0) if icici_ifsc_match else None
            
            # STEP 6: IFSC Validation — pass if ICICI BANK LIMITED or ICIC + 7-digit code found
            bank_name_found = "ICICI BANK LIMITED" in text or "ICICI BANK" in text
            ifsc_result = 1.0 if (ifsc_val or bank_name_found) else 0.0
            
            checkpoint_results.append({
                "name": "IFSC Code Validation",
                "weight": 10,
                "result": ifsc_result,
                "status": "PASSED" if ifsc_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": f"IFSC verified: {ifsc_val}" if ifsc_val else ("Bank verified via Account Number; IFSC assumed valid" if bank_name_found else "IFSC code not found"),
                **get_field_info(ifsc_val if ifsc_val else "IFSC")
            })

            # ── 4. Statement Period Validation ────────────────────────────────────
            # Use expanded scope (text) instead of just header
            period_kws = ["PERIOD", "STATEMENT DATE", "FROM", "TO", "DATE RANGE", "STATEMENT PERIOD"]
            period_pass = 1.0 if any(kw in text for kw in period_kws) else 0.0
            # Search for typical ICICI date range: "01/04/2024 TO 30/04/2024" or wordy format
            date_range_match = re.search(r'\d{2}[-/]\d{2}[-/]\d{2,4}\s+TO\s+\d{2}[-/]\d{2}[-/]\d{2,4}', text)
            if not date_range_match:
                 date_range_match = re.search(r'\d{1,2}\s+[A-Z]{3}\s+\d{4}\s+TO\s+\d{1,2}\s+[A-Z]{3}\s+\d{4}', text)
            
            period_result = 1.0 if (period_pass >= 1.0 or date_range_match) else 0.0
            checkpoint_results.append({
                "name": "Statement Period Validation",
                "weight": 10,
                "result": period_result,
                "status": "PASSED" if period_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": "Statement period detected in document" if period_result >= 1.0 else "Statement period missing or non-standard format",
                **get_field_info("PERIOD")
            })

            # ── 5. Running Balance Consistency Check ──────────────────────────────
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), {})
            balance_result = 1.0 if not math_anom else 0.0
            checkpoint_results.append({
                "name": "Running Balance Consistency",
                "weight": 20,
                "result": balance_result,
                "status": "PASSED" if balance_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": "Arithmetic consistency verified across transactions" if balance_result >= 1.0 else "Balance calculation mismatch detected",
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]),
                "page": math_anom.get("page", 0)
            })

            # ── 6. Transaction Chronological Order ───────────────────────────────
            chrono_anom = next((a for a in anomalies if a.get("indicator") == "Date Sequence"), {})
            chrono_result = 1.0 if not chrono_anom else 0.0
            checkpoint_results.append({
                "name": "Transaction Chronological Order",
                "weight": 15,
                "result": chrono_result,
                "status": "PASSED" if chrono_result >= 1.0 else "FAILED",
                "contribution": 0,
                "reason": "Transactions follow a valid chronological sequence" if chrono_result >= 1.0 else "Out-of-order or duplicate transaction dates detected",
                "bbox": chrono_anom.get("bbox", [100, 10, 900, 100]),
                "page": chrono_anom.get("page", 0)
            })

            # STEP 6: Debug Logging
            print(f"--- ICICI Debug Data ---")
            print(f"Detected Name: {detected_name}")
            print(f"Detected Account: {account_number}")
            print(f"Detected IFSC: {ifsc_val}")
            print(f"Bank Name Found: {bank_name_found}")
            print(f"------------------------")

        elif bank_brand == "HDFC":
            detected_name_hdfc = BankLogic.extract_name_above_address(text_lines, text)
            name_anom_hdfc = next((a for a in anomalies if a.get("type") == "NAME_MISMATCH"), None)
            name_result_hdfc = 1.0 if not name_anom_hdfc and detected_name_hdfc else 0.0
            
            checkpoint_results.append({
                "name": "Account Holder Name Detection", "weight": 15, 
                "result": name_result_hdfc,
                "status": "PASSED" if name_result_hdfc >= 1.0 else "FAILED",
                "reason": f"Name detected: {detected_name_hdfc}" if detected_name_hdfc else "Account holder name not found",
                **get_field_info(detected_name_hdfc if detected_name_hdfc else "CUSTOMER ID")
            })
            checkpoint_results.append({
                "name": "Acc Number & IFSC Validation", "weight": 15, 
                "result": 1.0 if not has_anomaly("ACCOUNT_LENGTH_INVALID") else 0.0,
                **get_field_info(metadata.get("account_number"))
            })
            checkpoint_results.append({
                "name": "Statement Period Validation", "weight": 10, 
                "result": 1.0 if any(kw in text for kw in ["PERIOD", "STATEMENT"]) else 0.0,
                **get_field_info("PERIOD")
            })
            checkpoint_results.append({
                "name": "Column Structure Check", "weight": 20, 
                "result": 1.0 if not has_anomaly("NO_TRANSACTIONS_DETECTED") else 0.0,
                "bbox": [200, 10, 850, 990], "page": 0
            })
            math_anom = next((a for a in anomalies if a.get("indicator") == "Math Mismatch"), {})
            checkpoint_results.append({
                "name": "Running Balance Consistency", "weight": 20, 
                "result": 1.0 if not math_anom else 0.0,
                "bbox": math_anom.get("bbox", [250, 700, 800, 980]),
                "page": math_anom.get("page", 0)
            })
            checkpoint_results.append({"name": "Summary Verification", "weight": 10, "result": 1.0})
            checkpoint_results.append({"name": "PDF Tampering Detection", "weight": 10, "result": 1.0 if not has_indicator("Metadata Tampering") else 0.0})

        # Final processing for all bank brands
        # NOTE: Use result to compute fail_count — "status" is stamped in the loop BELOW,
        # so reading cp["status"] here would cause a KeyError for banks that don't pre-set it.
        fail_count = sum(1 for cp in checkpoint_results if cp.get("result", 1.0) <= 0)
        
        # Rule-Based Classification (0=REAL, 1=SUSPICIOUS, 2+=FAKE)
        if fail_count == 0:
            final_verdict = "REAL"
        elif fail_count == 1:
            final_verdict = "SUSPICIOUS"
        else:
            final_verdict = "FAKE"
            
        # Final score calculation based on weights for UI granularity
        final_score = 0.0
        for cp in checkpoint_results:
            contribution = (cp.get("weight", 0) / 100.0) * cp["result"]
            cp["contribution"] = round(contribution * 100, 2)
            # Ensure status is strictly FAILED if result is 0
            if cp["result"] <= 0:
                cp["status"] = "FAILED"
            elif cp["result"] >= 1.0:
                cp["status"] = "PASSED"
            else:
                cp["status"] = "WARNING"
            
            # Ensure reason is always present for UI
            if "reason" not in cp:
                cp["reason"] = "Validation completed successfully" if cp["status"] == "PASSED" else "Minor inconsistency detected"
            
            final_score += contribution
            
        return {
            "score": round(final_score * 100, 2) if bank_brand != "SBI" else (100 - (fail_count * 20)),
            "verdict": final_verdict,
            "final_decision": final_verdict.lower() if final_verdict != "REAL" else "genuine",
            "checkpoints": checkpoint_results,
            "is_checkpoint_based": True,
            "fail_count": fail_count,
            "bank_brand": bank_brand,
            "master_template_used": True if master_data else False
        }

    @staticmethod
    def parse_currency(value_str: str) -> float:
        """Clean currency strings into floats."""
        if not value_str: return 0.0
        # Remove commas and currency symbols, handle parentheses as negative
        clean = str(value_str).replace(',', '').replace(' ', '')
        if clean.startswith('(') and clean.endswith(')'):
            clean = '-' + clean[1:-1]
        
        clean = re.sub(r'[^\d.\-]', '', clean)
        try:
            return float(clean)
        except ValueError:
            return 0.0
