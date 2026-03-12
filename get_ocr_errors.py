import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.app.db import async_session
from backend.app.models.document import Document
from sqlalchemy.future import select

async def get_ocr_errors():
    async with async_session() as db:
        result = await db.execute(select(Document).order_by(Document.id.desc()).limit(10))
        docs = result.scalars().all()
        
        for d in docs:
            print(f"ID: {d.id}, Status: {d.status}")
            if d.ocr_results:
                print(f"  OCR Error Field: {d.ocr_results.get('error', 'None')}")
            if d.forensic_results:
                anomalies = d.forensic_results.get('anomalies', [])
                for anom in anomalies:
                    if anom.get('type') == 'SYSTEM_ERROR':
                        print(f"  System Error: {anom.get('message')}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(get_ocr_errors())
