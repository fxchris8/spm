# @faw_sd
# Untuk koneksi dan operasi database menggunakan SQLAlchemy Supabase/PostgreSQL

import json
import os

import pandas as pd
import requests
from dotenv import load_dotenv
from requests.exceptions import ConnectionError
from requests.exceptions import JSONDecodeError as RequestsJSONDecodeError
from requests.exceptions import RequestException, Timeout
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env file")

# Create engine dengan connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Untuk serverless environment
    echo=False,  # Set True untuk debug SQL queries
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


def get_seamen_as_data():
    # SELALU coba API dulu setiap request
    print("🔵 Attempting to fetch seamen data from API...")

    try:
        url = "http://nanika.spil.co.id:3021/get-seamen"
        payload = json.dumps(
            {
                "age": 0,
                "status": "",
                "education": "",
                "experience": "",
                "certificate": "",
                "last_location": "",
                "last_position": "",
            }
        )
        headers = {"Content-Type": "application/json"}

        response = requests.get(url, headers=headers, data=payload)

        if response.status_code == 200:
            response_dict = response.json()
            data_seamen = response_dict.get("data_seamen", [])

            if data_seamen:
                df = pd.DataFrame(data_seamen)
                print(f"✅ API - Successfully fetched {len(df)} rows from API")
                return df
            else:
                print("⚠️ API returned empty data, falling back to Supabase...")
                raise ValueError("Empty data from API")
        else:
            print(
                f"⚠️ API returned status code {response.status_code}, falling back to Supabase..."
            )
            raise ValueError(f"API failed with status {response.status_code}")

    except (
        RequestException,
        Timeout,
        ConnectionError,
        RequestsJSONDecodeError,
        ValueError,
    ) as e:
        print(f"❌ API Error: {str(e)}")
        print("→ Fetching from Supabase as fallback...")

        # Fallback to Supabase with error handling
        try:
            query = "SELECT * FROM seamen"
            with engine.connect() as conn:
                df = pd.read_sql_query(text(query), conn)
                print(
                    f"✅ SUPABASE - Successfully fetched {len(df)} rows from Supabase"
                )
                return df
        except Exception as db_error:
            error_msg = "🔴 CRITICAL: Both API and Supabase failed!\n"
            error_msg += f"   - API Error: {str(e)}\n"
            error_msg += f"   - Supabase Error: {str(db_error)}\n"
            print(error_msg)
            raise Exception(error_msg)


def get_mutations_as_data():
    # SELALU coba API dulu setiap request
    print("🔵 Attempting to fetch mutations data from API...")

    try:
        url = "http://nanika.spil.co.id:3021/get-mutation"
        payload = json.dumps(
            {
                "seaman_name": "",
                "transaction_date_1": "01/01/2020",
                "transaction_date_2": "01/01/2025",
                "from_rank_name": "",
                "to_rank_name": "",
                "from_vessel_code": "",
                "to_vessel_code": "",
                "jenis": "",
            }
        )
        headers = {"Content-Type": "application/json"}

        response = requests.get(url, headers=headers, data=payload)

        if response.status_code == 200:
            response_dict = response.json()
            data_mutation = response_dict.get("data_mutation", [])

            if data_mutation:
                df = pd.DataFrame(data_mutation)
                print(f"✅ API - Successfully fetched {len(df)} rows from API")
                return df
            else:
                print("⚠️ API returned empty data, falling back to Supabase...")
                raise ValueError("Empty data from API")
        else:
            print(
                f"⚠️ API returned status code {response.status_code}, falling back to Supabase..."
            )
            raise ValueError(f"API failed with status {response.status_code}")

    except (
        RequestException,
        Timeout,
        ConnectionError,
        RequestsJSONDecodeError,
        ValueError,
    ) as e:
        print(f"❌ API Error: {str(e)}")
        print("→ Fetching from Supabase as fallback...")

        # Fallback to Supabase with error handling
        try:
            query = "SELECT * FROM mutations"
            with engine.connect() as conn:
                df = pd.read_sql_query(text(query), conn)
                print(
                    f"✅ SUPABASE - Successfully fetched {len(df)} rows from Supabase"
                )
                return df
        except Exception as db_error:
            error_msg = "🔴 CRITICAL: Both API and Supabase failed!\n"
            error_msg += f"   - API Error: {str(e)}\n"
            error_msg += f"   - Supabase Error: {str(db_error)}\n"
            print(error_msg)
            raise Exception(error_msg)


# Test connection
def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
