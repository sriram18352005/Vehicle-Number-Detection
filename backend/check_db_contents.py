from app.db import async_session
from sqlalchemy.future import select
from app.models.document import Document
from app.models.user import User
from app.models.audit import AuditLog
import asyncio
import json

async def check():
    async with async_session() as db:
        # Check users
        users = await db.execute(select(User))
        print("--- Users ---")
        for u in users.scalars().all():
            print(f"ID: {u.id}, Email: {u.email}")
            
        # Check documents
        docs = await db.execute(select(Document))
        print("\n--- Documents ---")
        for d in docs.scalars().all():
            print(f"ID: {d.id}, UserID: {d.user_id}, Verdict: {d.verdict}")
            
        # Check Audit
        audits = await db.execute(select(AuditLog))
        print("\n--- Audit Logs ---")
        for a in audits.scalars().all():
            print(f"ID: {a.id}, UserID: {a.user_id}, Action: {a.action}")

if __name__ == "__main__":
    asyncio.run(check())
