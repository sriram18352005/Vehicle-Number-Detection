import sqlite3
import os

DB_FILE = "sql_app.db"

if not os.path.exists(DB_FILE):
    for f in os.listdir("."):
        if f.endswith(".db"):
            DB_FILE = f
            break

print(f"Using DB: {DB_FILE}")

try:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    print("Scanning for broken PDF records...")
    # Get all docs with NULL preview_path
    cursor.execute("SELECT id, file_path FROM document WHERE preview_path IS NULL")
    rows = cursor.fetchall()
    fixed_count = 0

    for row in rows:
        doc_id, file_path = row
        if not file_path: continue
        
        # Normalize slashes for local check if needed, but DB stores relative path usually
        # Check if it looks like a PDF
        if file_path.lower().endswith(".pdf"):
            base, _ = os.path.splitext(file_path)
            expected_preview = f"{base}_preview.png"
            
            # Use strict path checking
            # stored path is relative e.g. "storage/uploads/..."
            if os.path.exists(expected_preview):
                print(f"Fixing ID {doc_id}: Found {expected_preview}")
                cursor.execute("UPDATE document SET preview_path = ? WHERE id = ?", (expected_preview, doc_id))
                fixed_count += 1
            else:
                print(f"ID {doc_id}: PDF but preview {expected_preview} NOT FOUND on disk.")

    if fixed_count > 0:
        conn.commit()
        print(f"Fixed {fixed_count} records.")
    else:
        print("No broken records found that could be fixed.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
