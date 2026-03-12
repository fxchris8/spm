"""
Module ini mengelola koneksi ke database dan konfigurasi API eksternal
menggunakan SQLAlchemy engine dan environment variables.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env file")

API_BASE_URL_IT = os.getenv("API_BASE_URL_IT")
API_BASE_URL_PUSAT = os.getenv("API_BASE_URL_PUSAT")

engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)


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
