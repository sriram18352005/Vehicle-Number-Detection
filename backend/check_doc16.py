import sqlite3
import os
import json

DB_FILE = "sql_app.db"
if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

cursor.execute("SELECT id, status, filename, ocr_results, forensic_results FROM document WHERE id = 16")
row = cursor.fetchone()
if row:
    print(f"ID: {row[0]}")
    print(f"Status: {row[1]}")
    print(f"Filename: {row[2]}")
    print(f"\nOCR Results:")
    if row[3]:
        ocr = json.loads(row[3])
        print(json.dumps(ocr, indent=2))
    else:
        print("  None")
    print(f"\nForensic Results:")
    if row[4]:
        forensic = json.loads(row[4])
        print(json.dumps(forensic, indent=2))
    else:
        print("  None")

conn.close()
