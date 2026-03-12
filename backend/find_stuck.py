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

print("Status Counts:")
cursor.execute("SELECT status, count(*) FROM document GROUP BY status")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]}")

print("\nDocuments in PENDING or PROCESSING:")
cursor.execute("SELECT id, filename, status, created_at FROM document WHERE status IN ('PENDING', 'PROCESSING') ORDER BY id DESC")
for row in cursor.fetchall():
    print(f"ID: {row[0]} | File: {row[1]} | Status: {row[2]} | Created: {row[3]}")

conn.close()
