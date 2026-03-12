import asyncio
import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.getcwd())

from app.db import async_session
from app.models.document import Document
from sqlalchemy.future import select
from app.forensics.pre_processing import preprocess_image

async def main():
    print("Starting preview regeneration...")
    async with async_session() as db:
        # Get PDF docs with NULL preview_path
        result = await db.execute(select(Document).where(Document.preview_path == None))
        docs = result.scalars().all()
        
        count = 0
        for doc in docs:
            if doc.file_path and doc.file_path.lower().endswith(".pdf"):
                print(f"Processing ID {doc.id} ({doc.filename})...")
                
                if os.path.exists(doc.file_path):
                    try:
                        print(f" -> Generating preview for {doc.file_path}")
                        # preprocess_image generates the preview file as side effect for PDFs
                        preprocess_image(doc.file_path)
                        
                        base, _ = os.path.splitext(doc.file_path)
                        expected_preview = f"{base}_preview.png"
                        
                        if os.path.exists(expected_preview):
                            doc.preview_path = expected_preview
                            count += 1
                            print(f" -> Success! Updated DB.")
                        else:
                            print(f" -> Failed: {expected_preview} not created.")
                            
                    except Exception as e:
                        print(f" -> Error: {e}")
                else:
                    print(f" -> File missing on disk: {doc.file_path}")
        
        if count > 0:
            await db.commit()
            print(f"Committed {count} updates.")
        else:
            print("No updates needed.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
