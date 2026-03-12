import sqlite3
import os

DB_FILE = "sql_app.db"

if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

try:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print(f"Checking document ID 11...")
    cursor.execute("SELECT id, filename, file_path, preview_path FROM document WHERE id = 11")
    rows = cursor.fetchall()
    
    if not rows:
        print("ID 11 not found.")
    else:
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"Filename: {row[1]}")
            print(f"File Path: '{row[2]}'")
            print(f"File Path Type: {type(row[2])}")
            print(f"Preview Path: {row[3]}")
    
    conn.close()
except Exception as e:
    print(f"DB Error: {e}")
