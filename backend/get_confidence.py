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
cursor.execute("SELECT id, confidence_score, verdict FROM document WHERE id = 16")
row = cursor.fetchone()
if row:
    print(f"Document ID: {row[0]}")
    print(f"Confidence Score: {row[1]}")
    print(f"Verdict: {row[2]}")

conn.close()
