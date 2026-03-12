import sqlite3
def check():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM document LIMIT 5")
    rows = cursor.fetchall()
    print(f"Docs (sample): {rows}")
    
    cursor.execute("SELECT COUNT(*) FROM document")
    print(f"Total docs: {cursor.fetchone()[0]}")
    conn.close()
check()
