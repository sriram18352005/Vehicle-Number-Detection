import sqlite3
def fix():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    
    # Standardize verdicts
    cursor.execute("UPDATE document SET verdict = 'FAKE' WHERE verdict = 'LIKELY FAKE'")
    print(f"Standardized {cursor.rowcount} LIKELY FAKE to FAKE")
    
    # Also ensure user 1 is associated with everything for now as per previous fix
    cursor.execute("UPDATE document SET user_id = 1 WHERE user_id IS NULL")
    print(f"Updated {cursor.rowcount} NULL user_id documents")
    
    conn.commit()
    conn.close()
fix()
