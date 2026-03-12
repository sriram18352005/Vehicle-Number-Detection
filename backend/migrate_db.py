import sqlite3
import os

def migrate():
    db_path = os.path.expanduser('~/.al_authenticator/sql_app.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(document)")
    columns = [col[1] for col in cursor.fetchall()]
    
    cols_to_add = [
        ("selected_bank", "VARCHAR"),
    ]
    
    for col_name, col_type in cols_to_add:
        if col_name not in columns:
            try:
                print(f"Adding column {col_name}...")
                cursor.execute(f"ALTER TABLE document ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added {col_name}")
            except Exception as e:
                print(f"Failed to add {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
