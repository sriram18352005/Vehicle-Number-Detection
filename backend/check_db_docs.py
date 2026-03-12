import asyncio
from app.db import async_session
from app.models.document import Document
from sqlalchemy.future import select

async def check_docs():
    async with async_session() as db:
        result = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(5))
        docs = result.scalars().all()
        for doc in docs:
            print(f"ID: {doc.id}")
            print(f"Filename: {doc.filename}")
            print(f"Status: {doc.status}")
            print(f"Image URL: {doc.image_url}")
            print(f"Preview Path: {doc.preview_path}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_docs())
