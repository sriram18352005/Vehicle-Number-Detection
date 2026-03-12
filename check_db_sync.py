import sqlite3

DATABASE_PATH = "sql_app.db"

def check_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, file_path, preview_path FROM documents ORDER BY id DESC LIMIT 5;")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, Filename: {row[1]}, File Path: {row[2]}, Preview Path: {row[3]}")
    conn.close()

if __name__ == "__main__":
    check_db()
