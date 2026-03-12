import sqlite3
import os

db_path = "backend/sql_app.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:", tables)
    conn.close()
else:
    print(f"Database not found at {db_path}")
