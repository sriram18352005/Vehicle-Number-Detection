import sqlite3
import os

db_path = "../sql_app.db"
print(f"Checking database at: {os.path.abspath(db_path)}")

try:
    conn = sqlite3.connect(db_path, timeout=5)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Connected successfully. Tables: {tables}")
    conn.close()
except Exception as e:
    print(f"Database error: {e}")
