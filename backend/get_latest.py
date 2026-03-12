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

cursor.execute("SELECT id, status, filename FROM document ORDER BY id DESC LIMIT 1")
row = cursor.fetchone()
if row:
    print(f"LATEST_DOC_ID={row[0]}")
    print(f"LATEST_DOC_STATUS={row[1]}")
    print(f"LATEST_DOC_FILE={row[2]}")
else:
    print("NO_DOCS_FOUND")

conn.close()
