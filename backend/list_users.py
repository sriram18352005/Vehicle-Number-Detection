import sqlite3
def list_users():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, hashed_password FROM user")
    print("--- Registered Users ---")
    for row in cursor.fetchall():
        print(f"ID: {row[0]}, Email: {row[1]}, Name: {row[2]}, Hash: {row[3][:20]}...")
    conn.close()
list_users()
