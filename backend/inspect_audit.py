import sqlite3
def check():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, action, details FROM auditlog LIMIT 10")
    for row in cursor.fetchall():
        print(row)
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print(f"All tables: {cursor.fetchall()}")
    
    conn.close()
check()
