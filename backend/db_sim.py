import asyncio
import os
import json
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
import traceback

# Import models
import sys
# Add current directory to path
sys.path.append(os.path.abspath("."))
from app.models.base import Base
from app.models.document import Document, DocumentStatus
from app.models.audit import AuditLog
from app.core.config import settings

async def simulate_upload():
    print(f"SIMULATION: Registered tables: {list(Base.metadata.tables.keys())}")
    print("SIMULATION: Starting...")
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        try:
            # 1. Simulate Document creation
            print("SIMULATION: Creating Document record...")
            db_document = Document(
                filename="sim_test.txt",
                file_path="C:\\fake\\path\\sim_test.txt",
                file_type="text/plain",
                status=DocumentStatus.PENDING,
                user_id=2  # Using the known valid user ID
            )
            db.add(db_document)
            print("SIMULATION: Committing Document...")
            await db.commit()
            await db.refresh(db_document)
            print(f"SIMULATION: Document created with ID {db_document.id}")

            # 2. Simulate Audit Log creation
            print("SIMULATION: Creating AuditLog...")
            prev_log_query = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
            prev_log_result = await db.execute(prev_log_query)
            prev_log = prev_log_result.scalars().first()
            prev_hash = prev_log.hash_link if prev_log else "0" * 64
            
            log_data = f"{prev_hash}{'UPLOAD'}{db_document.id}{json.dumps({'filename': 'sim_test.txt', 'user_id': 2})}".encode()
            current_hash = hashlib.sha256(log_data).hexdigest()

            audit_log = AuditLog(
                user_id="2",
                action="UPLOAD",
                document_id=db_document.id,
                details={"filename": "sim_test.txt", "type": "text/plain", "user_id": 2},
                hash_link=current_hash
            )
            db.add(audit_log)
            print("SIMULATION: Committing AuditLog...")
            await db.commit()
            print("SIMULATION: SUCCESS.")

        except Exception as e:
            print("SIMULATION: FAILED!")
            print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(simulate_upload())
