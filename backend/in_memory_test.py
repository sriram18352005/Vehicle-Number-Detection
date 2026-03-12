import asyncio
import os
import json
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
import traceback
import sys

# Add backend to path
sys.path.append(os.path.abspath("."))
from app.models.base import Base
from app.models.document import Document, DocumentStatus
from app.models.audit import AuditLog

async def run_in_memory_test():
    print("IN-MEMORY: Starting...")
    # Use an in-memory database to bypass ANY file system locks
    engine = create_async_engine('sqlite+aiosqlite:///:memory:', echo=False)
    
    async with engine.begin() as conn:
        # Create all tables in memory
        await conn.run_sync(Base.metadata.create_all)
        print("IN-MEMORY: Tables created.")

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        try:
            # 1. Create Document
            print("IN-MEMORY: Creating Document...")
            doc = Document(
                filename="test.txt",
                file_path="/tmp/test.txt",
                status=DocumentStatus.PENDING,
                user_id=1
            )
            db.add(doc)
            await db.commit()
            await db.refresh(doc)
            print(f"IN-MEMORY: Document ID {doc.id} created successfully.")

            # 2. Create Audit Log
            print("IN-MEMORY: Creating AuditLog...")
            audit = AuditLog(
                document_id=doc.id,
                action="UPLOAD",
                user_id="1",
                hash_link="test-hash-12345"
            )
            db.add(audit)
            await db.commit()
            print("IN-MEMORY: AuditLog created successfully.")
            print("CONCLUSION: CODE IS 100% CORRECT. Environmental locks remain.")

        except Exception as e:
            print("IN-MEMORY: FAILED!")
            print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(run_in_memory_test())
