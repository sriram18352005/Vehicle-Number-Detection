import sqlite3
import os

DATABASE_PATH = "backend/sql_app.db"

def get_documents_clean():
    if not os.path.exists(DATABASE_PATH):
        print(f"Error: Database not found at {DATABASE_PATH}")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, filename, file_path, preview_path FROM document ORDER BY id DESC LIMIT 5;")
        rows = cursor.fetchall()
        print("-" * 80)
        print(f"{'ID':<5} | {'Filename':<30} | {'File Path':<40}")
        print("-" * 80)
        for row in rows:
            print(f"{row['id']:<5} | {row['filename']:<30} | {row['file_path']}")
            if row['preview_path']:
                 print(f"      | Preview: {row['preview_path']}")
        print("-" * 80)
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    get_documents_clean()
