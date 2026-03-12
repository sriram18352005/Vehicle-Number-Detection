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

cursor.execute("SELECT id, status, filename, created_at FROM document ORDER BY id DESC LIMIT 10")
rows = cursor.fetchall()
output = []
for row in rows:
    output.append(f"ID: {row[0]} | Status: {row[1]} | File: {row[2]} | Created: {row[3]}")

with open("recent_status.txt", "w") as f:
    f.write("\n".join(output))

conn.close()
print("Done")
