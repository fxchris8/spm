"""
Database Connection Module
Handles database connection and external API configuration.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env file")

# External API configuration
API_BASE_URL_IT = os.getenv("API_BASE_URL_IT")
API_BASE_URL_PUSAT = os.getenv("API_BASE_URL_PUSAT")

# Create database engine
engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)

print("=" * 60)
print("DATABASE CONNECTION MODULE")
print("=" * 60)


def get_db_connection():
    """
    Get database connection from engine.
    
    Returns:
        Connection object
    """
    return engine.connect()


def get_api_config():
    """
    Get external API configuration.
    
    Returns:
        dict: API configuration with base URLs
    """
    return {
        "api_it": API_BASE_URL_IT,
        "api_pusat": API_BASE_URL_PUSAT,
    }
