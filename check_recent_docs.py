import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Force database path
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///c:/Users/vvsri/OneDrive/Desktop/al authenticator2/backend/sql_app.db?check_same_thread=False"

from app.db import async_session
from app.models.document import Document
from sqlalchemy.future import select

async def check():
    async with async_session() as db:
        result = await db.execute(select(Document).order_by(Document.id.desc()).limit(5))
        docs = result.scalars().all()
        for d in docs:
            print(f"--- Document ID: {d.id} ---")
            print(f"Status: {d.status}")
            print(f"Verdict: {d.verdict}")
            print(f"Forensic Results: {d.forensic_results}")
            print(f"OCR Error: {d.ocr_results.get('error') if d.ocr_results else 'None'}")
            print("-" * 30)

if __name__ == "__main__":
    asyncio.run(check())
