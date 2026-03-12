import sqlite3
import os
from datetime import datetime, timedelta

DB_FILE = "sql_app.db"
if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# Get documents from the last 5 minutes
five_min_ago = (datetime.now() - timedelta(minutes=5)).isoformat()
cursor.execute("SELECT id, status, filename, created_at FROM document WHERE created_at > ? ORDER BY id DESC", (five_min_ago,))
rows = cursor.fetchall()
if rows:
    print(f"Documents created in the last 5 minutes:")
    for row in rows:
        print(f"ID: {row[0]} | Status: {row[1]} | File: {row[2]} | Created: {row[3]}")
else:
    print("No documents created in the last 5 minutes")

conn.close()
