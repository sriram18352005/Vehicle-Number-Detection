import sqlite3
import os

DB_FILE = "sql_app.db"
if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

print(f"Using DB: {DB_FILE}")

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

print("Recent 10 Documents Status:")
cursor.execute("SELECT id, filename, status, verdict, confidence_score, created_at FROM document ORDER BY id DESC LIMIT 10")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]} | File: {row[1]} | Status: {row[2]} | Verdict: {row[3]} | Conf: {row[4]} | Created: {row[5]}")

conn.close()
