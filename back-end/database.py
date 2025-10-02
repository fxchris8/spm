# @faw_sd
# Untuk koneksi dan operasi database menggunakan SQLAlchemy Supabase/PostgreSQL

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env file")

# Create engine dengan connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Untuk serverless environment
    echo=False  # Set True untuk debug SQL queries
)

def get_connection():
    """Get database connection"""
    return engine.connect()

def execute_query(query, params=None):
    """Execute SELECT query dan return results"""
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        return result.fetchall()

def execute_update(query, params=None):
    """Execute INSERT/UPDATE/DELETE query"""
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        conn.commit()
        return result

# Test connection
def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False