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
            # Manually invoke the property logic to see what it returns
            import os
            url = f"/static/uploads/{os.path.basename(doc.file_path)}"
            print(f"Computed URL: {url}")
            print(f"Actual Property: {doc.file_url}")
        else:
            print("No documents found.")

if __name__ == "__main__":
    asyncio.run(main())
