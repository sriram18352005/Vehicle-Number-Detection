import sys
import os
sys.path.append(os.getcwd())

from app.db import async_session
from app.models.document import Document
from sqlalchemy.future import select
import asyncio
import json

async def check_documents():
    async with async_session() as db:
        result = await db.execute(
            select(Document).order_by(Document.id.desc()).limit(5)
        )
        docs = result.scalars().all()
        
        print("=" * 80)
        print("RECENT DOCUMENTS")
        print("=" * 80)
        
        for d in docs:
            print(f"\nID: {d.id}")
            print(f"Filename: {d.filename}")
            print(f"Status: {d.status}")
            print(f"Verdict: {d.verdict}")
            print(f"Confidence Score: {d.confidence_score}")
            print(f"OCR Results: {json.dumps(d.ocr_results, indent=2) if d.ocr_results else 'None'}")
            print(f"Forensic Results: {json.dumps(d.forensic_results, indent=2) if d.forensic_results else 'None'}")
            print("-" * 80)

asyncio.run(check_documents())
