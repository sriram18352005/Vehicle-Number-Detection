import asyncio
from app.db import async_session
from app.models.document import Document
from sqlalchemy.future import select

async def main():
    async with async_session() as db:
        result = await db.execute(select(Document).order_by(Document.id.desc()).limit(1))
        doc = result.scalars().first()
        if doc:
            print(f"ID: {doc.id}")
            print(f"Filename: {doc.filename}")
            print(f"File Path: {doc.file_path}")
            print(f"File URL: {doc.file_url}")
            print(f"Status: {doc.status}")
            print(f"Verdict: {doc.verdict}")
        else:
            print("No documents found.")

if __name__ == "__main__":
    asyncio.run(main())
