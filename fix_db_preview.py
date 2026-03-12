import sqlite3
import os

db_path = 'backend/sql_app.db'
doc_id = 12
preview_file = 'dc541b8a-2645-49cc-ae39-e8905b71840d_preview.png'
preview_path = f'storage/uploads/{preview_file}'

print(f"Connecting to {db_path}...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if file exists
full_path = os.path.join('backend', preview_path)
if os.path.exists(full_path):
    print(f"File found at {full_path}")
    cursor.execute("UPDATE document SET preview_path=? WHERE id=?", (preview_path, doc_id))
    conn.commit()
    print(f"Updated document {doc_id} with preview_path: {preview_path}")
else:
    print(f"ERROR: Preview file not found at {full_path}")

conn.close()
