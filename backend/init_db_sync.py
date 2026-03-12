from sqlalchemy import create_engine
from app.models.base import Base
from app.models.document import Document
from app.models.audit import AuditLog
from app.models.user import User
from app.models.master_template import BankMasterTemplate
from app.core.config import DATABASE_PATH
import os

# Use sync engine
engine = create_engine(f"sqlite:///{DATABASE_PATH}")

print(f"Creating tables in {DATABASE_PATH}...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
