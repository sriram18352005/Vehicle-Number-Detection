import sys
import os
sys.path.append(os.getcwd())

from app.db import async_session
from app.models.document import Document, DocumentStatus
from sqlalchemy.future import select
import asyncio

async def fix_stuck_documents():
    """
    Reset any stuck documents in PROCESSING status back to PENDING
    so they can be reprocessed with the fixed code.
    """
    async with async_session() as db:
        result = await db.execute(
            select(Document).where(Document.status == DocumentStatus.PROCESSING)
        )
        stuck_docs = result.scalars().all()
        
        if not stuck_docs:
            print("✓ No stuck documents found")
            return
        
        print(f"Found {len(stuck_docs)} stuck documents in PROCESSING status")
        print("Resetting them to PENDING for reprocessing...\n")
        
        for doc in stuck_docs:
            print(f"  - Document ID {doc.id}: {doc.filename}")
            doc.status = DocumentStatus.PENDING
        
        await db.commit()
        print(f"\n✓ Reset {len(stuck_docs)} documents to PENDING status")
        print("These will be reprocessed automatically on next upload or manual reprocess")

asyncio.run(fix_stuck_documents())
