import sqlite3
def check():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, email FROM user")
    users = cursor.fetchall()
    print(f"Users: {users}")
    
    for user_id, email in users:
        cursor.execute("SELECT COUNT(*) FROM document WHERE user_id = ?", (user_id,))
        doc_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM auditlog WHERE user_id = ?", (str(user_id),))
        audit_count = cursor.fetchone()[0]
        print(f"User {user_id} ({email}): {doc_count} docs, {audit_count} audits")
    
    cursor.execute("SELECT COUNT(*) FROM document WHERE user_id IS NULL")
    null_docs = cursor.fetchone()[0]
    print(f"Documents with user_id IS NULL: {null_docs}")
    
    conn.close()
check()
