import asyncio
import os
import shutil
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import time

# Mocking settings and models
class settings:
    DATABASE_URL = "sqlite+aiosqlite:///./sql_app.db?check_same_thread=False"

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Assuming these exist in the environment
from app.models.document import Document, DocumentStatus
from app.models.audit import AuditLog

async def simulate_upload():
    print(f"[{time.time()}] START: Simulating upload logic...")
    
    async with async_session() as db:
        try:
            # 1. Simulate file save
            file_id = str(uuid.uuid4())
            file_path = f"manual_test_{file_id}.txt"
            print(f"[{time.time()}] SAVING file: {file_path}")
            with open(file_path, "w") as f:
                f.write("test content")
            
            # 2. Save document record
            print(f"[{time.time()}] DB: Adding Document record...")
            db_document = Document(
                filename="manual_test.txt",
                file_path=os.path.abspath(file_path),
                file_type="text/plain",
                status=DocumentStatus.PENDING
            )
            db.add(db_document)
            print(f"[{time.time()}] DB: Committing Document...")
            await db.commit()
            print(f"[{time.time()}] DB: Document Committed. ID: {db_document.id}")
            
            # 3. Audit Log part (Likely stall location)
            print(f"[{time.time()}] DB: Querying last AuditLog...")
            prev_log_query = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
            prev_log_result = await db.execute(prev_log_query)
            prev_log = prev_log_result.scalars().first()
            print(f"[{time.time()}] DB: Last AuditLog found (ID: {prev_log.id if prev_log else 'None'})")
            
            print(f"[{time.time()}] SUCCESS: Mock upload finished.")
            
        except Exception as e:
            print(f"[{time.time()}] FAILED: {e}")
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

if __name__ == "__main__":
    asyncio.run(simulate_upload())
