import sqlite3
import os

db_path = "backend/sql_app.db"
if not os.path.exists(db_path):
    db_path = "sql_app.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, status, file_path FROM document ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Recent Documents:")
    for row in rows:
        print(f"ID: {row[0]}, Status: {row[1]}, Path: {row[2]}")
    conn.close()
else:
    print(f"Database not found at {db_path}")
