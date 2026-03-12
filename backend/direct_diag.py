import sqlite3
import json

try:
    conn = sqlite3.connect('sql_app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, filename, status, verdict FROM document ORDER BY id DESC LIMIT 5;')
    rows = cursor.fetchall()
    print("RECORDS FOUND:")
    for r in rows:
        print(f"ID: {r['id']} | Status: {r['status']} | Verdict: {r['verdict']} | Name: {r['filename']}")
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
