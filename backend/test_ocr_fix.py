import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.forensics.ocr_pipeline import perform_ocr

async def test_ocr():
    from app.db import async_session
    from app.models.document import Document
    from sqlalchemy import select
    
    async with async_session() as db:
        res = await db.execute(select(Document).order_by(Document.id.desc()).limit(1))
        doc = res.scalars().first()
        if not doc:
            print("No documents found in DB.")
            return
        target_file = doc.file_path

    if not os.path.exists(target_file):
        print(f"File {target_file} not found on disk.")
        return

    print(f"Testing OCR on: {target_file}")
    results = perform_ocr(target_file, original_path=target_file)
    
    import json
    with open("test_output.txt", "w") as f:
        f.write("OCR RESULTS:\n")
        f.write(f"TEXT PREVIEW: {results.get('text', '')[:500]}\n")
        f.write(f"ENGINE: {results.get('engine')}\n")
        f.write(f"DOCUMENT_TYPE: {results.get('document_type')}\n")
        f.write(f"EXTRACTED_DATA: {json.dumps(results.get('extracted_data'), indent=2)}\n")
    print("Results written to test_output.txt")

if __name__ == "__main__":
    asyncio.run(test_ocr())
