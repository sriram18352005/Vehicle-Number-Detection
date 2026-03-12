import sqlite3
import os

DB_FILE = "sql_app.db"
if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

cursor.execute("SELECT id, status, filename, ocr_results FROM document ORDER BY id DESC LIMIT 3")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]} | Status: {row[1]} | File: {row[2]}")
    print(f"OCR Results: {row[3]}")
    print("---")

conn.close()
