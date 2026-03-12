import asyncio
from app.db import async_session
from sqlalchemy.future import select
from app.models.document import Document
import json

async def get_doc():
    async with async_session() as db:
        result = await db.execute(select(Document).where(Document.id == 32))
        doc = result.scalars().first()
        
        if not doc:
            print("Document not found")
            return
            
        print("=" * 60)
        print(f"DOCUMENT ID: {doc.id}")
        print(f"FILENAME: {doc.filename}")
        print(f"VERDICT: {doc.verdict}")
        print(f"CONFIDENCE: {doc.confidence_score:.2%}")
        print("=" * 60)
        
        print("\n### ANOMALIES (shown as red error boxes):")
        forensic_results = doc.forensic_results or {}
        anomalies = forensic_results.get('anomalies', [])
        
        if anomalies:
            print(json.dumps(anomalies, indent=2))
        else:
            print("None")
        
        print("\n### SYMBOL RESULTS (YOLO bounding boxes):")
        symbol_results = doc.symbol_results or []
        
        if symbol_results:
            print(f"Total symbols detected: {len(symbol_results)}")
            for i, sym in enumerate(symbol_results[:5]):  # Show first 5
                print(f"\n  Symbol {i+1}:")
                print(f"    Label: {sym.get('label', 'N/A')}")
                print(f"    Confidence: {sym.get('confidence', 0):.2%}")
                print(f"    BBox: {sym.get('bbox', [])}")
        else:
            print("None")
        
        print("\n### OCR RESULTS:")
        ocr = doc.ocr_results or {}
        print(f"  Engine: {ocr.get('engine', 'N/A')}")
        print(f"  Confidence: {ocr.get('confidence', 0):.2%}")
        print(f"  Text preview: {ocr.get('text', '')[:100]}...")

asyncio.run(get_doc())
