import sqlite3
import os

db_path = "sql_app.db" # Updated from forensics.db

def check():
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        # Try to find it
        for root, dirs, files in os.walk("."):
            if "forensics.db" in files:
                db_path = os.path.join(root, "forensics.db")
                break
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Users ---")
    try:
        cursor.execute("SELECT id, email FROM user")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(e)
            
    print("\n--- Documents ---")
    try:
        cursor.execute("SELECT id, user_id, verdict, filename FROM document")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(e)
            
    print("\n--- Audit Logs ---")
    try:
        cursor.execute("SELECT id, user_id, action FROM auditlog")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(e)
        
    conn.close()

if __name__ == "__main__":
    check()
