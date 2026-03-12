import sys
import os
sys.path.append(os.getcwd())

from app.db import async_session
from app.models.document import Document
from sqlalchemy.future import select
import asyncio
import json
from datetime import datetime

async def check_last_docs():
    async with async_session() as db:
        result = await db.execute(select(Document).order_by(Document.id.desc()).limit(5))
        docs = result.scalars().all()
        print(f"Current Time: {datetime.now()}")
        print("-" * 50)
        for d in docs:
            # We assume created_at might exist or we use id as proxy
            print(f"ID: {d.id} | Status: {d.status} | Verdict: {d.verdict} | Name: {d.filename}")
            if d.forensic_results:
                anoms = d.forensic_results.get("anomalies", [])
                if anoms:
                    print(f"  Last Anomaly: {anoms[-1]['message'] if anoms else 'None'}")
                if "pdf_error" in d.forensic_results.get("metadata", {}):
                     print(f"  Metadata Error: {d.forensic_results['metadata']['pdf_error']}")
        print("-" * 50)

asyncio.run(check_last_docs())
