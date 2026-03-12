import sqlite3
import os
from datetime import datetime

DB_FILE = "sql_app.db"
if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

cursor.execute("SELECT id, status, filename, created_at FROM document WHERE status = 'PROCESSING' ORDER BY id DESC")
rows = cursor.fetchall()
if rows:
    print("Documents stuck in PROCESSING:")
    for row in rows:
        print(f"ID: {row[0]} | File: {row[2]} | Created: {row[3]}")
        created = datetime.fromisoformat(row[3])
        age = datetime.now() - created
        print(f"  Age: {age}")
else:
    print("No documents stuck in PROCESSING")

conn.close()
