import sqlite3
def check():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    
    # Check User 1 stats
    print("--- User 1 Stats ---")
    cursor.execute("SELECT verdict, COUNT(*) FROM document WHERE user_id = 1 GROUP BY verdict")
    for row in cursor.fetchall():
        print(row)
        
    cursor.execute("SELECT verdict, COUNT(*) FROM document GROUP BY verdict")
    print(f"\nOverall Stats: {cursor.fetchall()}")
    
    conn.close()
check()
