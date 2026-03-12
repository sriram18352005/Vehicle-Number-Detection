from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
import json
import os
from pathlib import Path

# Setup DB connection
HOME = Path.home()
AL_DATA_DIR = HOME / ".al_authenticator"
DATABASE_PATH = AL_DATA_DIR / "sql_app.db"
DATABASE_URL = f"sqlite:///\"{DATABASE_PATH}\"" 

# Use a raw connection to avoid model dependencies if possible
import sqlite3

def check_latest_doc():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, filename, ocr_results, forensic_results FROM document ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        print("No documents found in DB.")
        return

    doc_id, filename, ocr_json, forensic_json = row
    print(f"Checking Document ID: {doc_id} ({filename})")
    
    ocr_data = json.loads(ocr_json) if ocr_json else {}
    forensic_data = json.loads(forensic_json) if forensic_json else {}

    print("\n--- OCR EXTRACTED DATA ---")
    print(json.dumps(ocr_data.get("extracted_data", {}), indent=2))
    
    print("\n--- FORENSIC EXTRACTED TEXT ---")
    # Search for "Extracted Text" in forensic results
    ext_text = forensic_data.get("final_decision", {}).get("Extracted Text", {})
    if not ext_text:
        # Check anomalies or other fields
        pass
    print(json.dumps(ext_text, indent=2))

    print("\n--- FULL TEXT PREVIEW (First 200 chars) ---")
    full_text = ocr_data.get("text", "")
    print(full_text[:200] + "...")
    print(f"(Total Text Length: {len(full_text)})")
    
    conn.close()

if __name__ == "__main__":
    check_latest_doc()
