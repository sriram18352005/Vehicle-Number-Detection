import sqlite3
import os

db_path = 'sql_app.db'
print(f"Checking DB: {os.path.abspath(db_path)}")

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("\n--- LAST 5 DOCUMENTS ---")
    cursor.execute('SELECT id, filename, status, verdict FROM document ORDER BY id DESC LIMIT 5;')
    for r in cursor.fetchall():
        print(f"ID: {r['id']} | Status: {r['status']} | Verdict: {r['verdict']} | Name: {r['filename']}")
    
    print("\n--- LAST 5 AUDIT LOGS ---")
    # Check if audit_log table exists first
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log';")
    if cursor.fetchone():
        cursor.execute('SELECT id, action, document_id, created_at FROM audit_log ORDER BY id DESC LIMIT 5;')
        for r in cursor.fetchall():
            print(f"ID: {r['id']} | Action: {r['action']} | DocID: {r['document_id']} | Time: {r['created_at']}")
    else:
        print("Table 'audit_log' does not exist.")

    print("\n--- DB STATS ---")
    cursor.execute("SELECT COUNT(*) FROM document")
    print(f"Total Documents: {cursor.fetchone()[0]}")
    
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")

storage_path = os.path.abspath('../storage_forensics')
print(f"\nChecking Storage: {storage_path}")
if os.path.exists(storage_path):
    files = os.listdir(storage_path)
    print(f"Total files in storage: {len(files)}")
    # Print last 3 files by mtime
    full_paths = [os.path.join(storage_path, f) for f in files]
    full_paths.sort(key=os.path.getmtime, reverse=True)
    for f in full_paths[:3]:
        print(f"Latest File: {os.path.basename(f)} | Size: {os.path.getsize(f)} | Time: {os.path.getmtime(f)}")
else:
    print("Storage directory NOT FOUND!")
