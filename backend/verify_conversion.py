import os
import asyncio
from app.db import async_session
from app.models.document import Document
from worker.tasks import async_process_document
from sqlalchemy.future import select

async def test_processing():
    # Find a PDF document that is PENDING or recently uploaded
    async with async_session() as db:
        # result = await db.execute(select(Document).where(Document.file_path.ilike('%.pdf')).order_by(Document.created_at.desc()))
        # Just take the latest one
        result = await db.execute(select(Document).order_by(Document.created_at.desc()))
        document = result.scalars().first()
        
        if not document:
            print("No documents found to test.")
            return
            
        print(f"Testing processing for Document ID: {document.id} ({document.filename})")
        print(f"Original path: {document.file_path}")
        
        # Manually trigger the processing
        try:
            res = await async_process_document(document.id)
            print(f"Processing Result: {res}")
            
            # Re-fetch to see updated fields
            await db.refresh(document)
            print(f"New Status: {document.status}")
            print(f"New Verdict: {document.verdict}")
            print(f"Preview Path: {document.preview_path}")
            print(f"File URL: {document.file_url}")
            
            # Check if preview file exists
            if document.preview_path and os.path.exists(document.preview_path):
                print(f"SUCCESS: Preview image exists at {document.preview_path}")
                print(f"Size: {os.path.getsize(document.preview_path)} bytes")
            else:
                print(f"FAILURE: Preview image NOT found at {document.preview_path}")
                
        except Exception as e:
            print(f"Processing failed with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_processing())


    