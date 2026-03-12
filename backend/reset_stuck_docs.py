import sqlite3
import os

db_path = os.path.join("app", "sql_app.db")
if not os.path.exists(db_path):
    db_path = "sql_app.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Reset any documents stuck in PROCESSING to FAILED so user can re-process
    cursor.execute("UPDATE document SET status = 'FAILED' WHERE status = 'PROCESSING'")
    changes = conn.total_changes
    conn.commit()
    conn.close()
    print(f"Database Reset: {changes} stuck documents moved to FAILED status.")
else:
    print("Database file not found.")
