import sqlite3
def fix():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    
    # Associate all docs with user 1 if NULL
    cursor.execute("UPDATE document SET user_id = 1 WHERE user_id IS NULL")
    print(f"Updated {cursor.rowcount} documents.")
    
    # Associate all audits with user 1 if NULL
    cursor.execute("UPDATE auditlog SET user_id = '1' WHERE user_id IS NULL OR user_id = 'None'")
    print(f"Updated {cursor.rowcount} audit logs.")
    
    conn.commit()
    conn.close()
fix()
