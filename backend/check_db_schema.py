import sqlite3
import os

db_path = "forensics.db"
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    # Try common locations
    possible = ["backend/forensics.db", "app/forensics.db"]
    for p in possible:
        if os.path.exists(p):
            db_path = p
            break

print(f"Checking DB: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get table info
cursor.execute("PRAGMA table_info(document)")
cols = cursor.fetchall()
for c in cols:
    print(c)

# Check for check constraints (Enums in SQLite often use CHECK)
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='document'")
print(cursor.fetchone()[0])
conn.close()
