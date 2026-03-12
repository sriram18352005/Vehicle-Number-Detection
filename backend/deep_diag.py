import os
import sqlite3
import time
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

db_url = "sqlite+aiosqlite:///./sql_app.db"
engine = create_async_engine(db_url)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def diag():
    print(f"[{time.time()}] DIAG: Testing Storage Writability...")
    storage_path = os.path.abspath('../storage_forensics')
    test_file = os.path.join(storage_path, f"write_test_{int(time.time())}.tmp")
    try:
        with open(test_file, "w") as f:
            f.write("test")
        print(f"[{time.time()}] DIAG: Storage write SUCCESS.")
        os.remove(test_file)
    except Exception as e:
        print(f"[{time.time()}] DIAG: Storage write FAILED: {e}")

    print(f"[{time.time()}] DIAG: Testing DB Async Contention...")
    async def try_trans():
        async with engine.begin() as conn:
            print(f"[{time.time()}]   CONN: Transaction started...")
            await conn.execute(text("SELECT 1"))
            print(f"[{time.time()}]   CONN: Transaction finished.")
            
    try:
        await asyncio.wait_for(try_trans(), timeout=5.0)
        print(f"[{time.time()}] DIAG: DB Async Trans SUCCESS.")
    except Exception as e:
        print(f"[{time.time()}] DIAG: DB Async Trans FAILED/TIMED OUT: {e}")

if __name__ == "__main__":
    asyncio.run(diag())
