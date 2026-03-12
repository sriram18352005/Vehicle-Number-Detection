import sqlite3

DATABASE_PATH = "backend/sql_app.db"

def list_tables():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", [t[0] for t in tables])
    
    for table in [t[0] for t in tables]:
        print(f"\nScheme for {table}:")
        cursor.execute(f"PRAGMA table_info({table});")
        print(cursor.fetchall())
        
    conn.close()

if __name__ == "__main__":
    list_tables()
