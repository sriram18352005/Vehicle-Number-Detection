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

print("Searching for doc with file_path like 00a3301d...")
cursor.execute("SELECT id, filename, file_path, preview_path FROM document WHERE file_path LIKE '%00a3301d%'")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}")
    print(f"Filename: {row[1]}")
    print(f"File Path: {row[2]}")
    print(f"Preview Path: {row[3]}")

conn.close()
