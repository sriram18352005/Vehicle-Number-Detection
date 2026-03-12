import sqlite3

try:
    conn = sqlite3.connect('sql_app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, status, verdict FROM document WHERE status = 'PROCESSING' ORDER BY id ASC;")
    rows = cursor.fetchall()
    print(f"PROCESSING RECORDS FOUND: {len(rows)}")
    for r in rows:
        print(f"ID: {r['id']} | Status: {r['status']} | Verdict: {r['verdict']} | Name: {r['filename']}")
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
