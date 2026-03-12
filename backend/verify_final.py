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

print("Final Database State (Recent 10 Docs):")
cursor.execute("SELECT id, filename, file_path, preview_path, status FROM document ORDER BY id DESC LIMIT 10")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]} | File: {row[1]} | Preview: {row[3]} | Status: {row[4]}")

conn.close()
