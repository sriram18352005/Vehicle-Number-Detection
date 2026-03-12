import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.worker.tasks import async_process_document
from backend.app.db import async_session
from backend.app.models.document import Document
from sqlalchemy.future import select

async def test_latest_doc():
    async with async_session() as db:
        # Get the latest document ID
        result = await db.execute(select(Document).order_by(Document.id.desc()).limit(1))
        doc = result.scalars().first()
        if not doc:
            print("No documents found in database.")
            return
        
        doc_id = doc.id
        print(f"Testing analysis for Document ID: {doc_id}, Filename: {doc.filename}")
        print("-" * 40)
        
        try:
            res = await async_process_document(doc_id)
            print(f"\nResult: {res}")
        except Exception as e:
            print(f"\nCaught Exception in test script: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_latest_doc())
