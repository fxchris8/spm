# @faw_sd
# COMPLETE: Scheduler + Data Fetcher untuk Frontend
# 1. Scheduler: Sync data dari API ASLI ke Supabase setiap 00:01
# 2. Data Fetcher: Fungsi untuk Frontend fetch dari Supabase

import json
import os
from datetime import datetime

import pandas as pd
import requests
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env file")

engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)

print("=" * 60)
print("SEAMEN & MUTATIONS SYNC + DATA FETCHER")
print("=" * 60)


# ============================================================================
# BAGIAN 1: FETCH DATA DARI SUPABASE (Untuk Frontend/app.py)
# ============================================================================


def get_seamen_as_data():
    """
    Fetch data seamen dari Supabase Database
    Digunakan oleh app.py untuk melayani request frontend
    """
    try:
        query = "SELECT * FROM seamen"
        with engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)
            print(f"DONE - Fetched {len(df)} seamen records from database")
            return df
    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch seamen data: {str(e)}")


def get_mutations_as_data():
    """
    Fetch data mutations dari Supabase Database
    Digunakan oleh app.py untuk melayani request frontend
    """
    try:
        query = "SELECT * FROM mutations"
        with engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)
            print(f"DONE - Fetched {len(df)} mutation records from database")
            return df
    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch mutations data: {str(e)}")


# ============================================================================
# BAGIAN 2: FETCH DATA DARI API ASLI (Untuk Scheduler)
# ============================================================================


def fetch_seamen_from_original_api():
    """Fetch data seamen dari API URL ASLI"""
    print(f"START - [{datetime.now()}] Starting seamen sync from ORIGINAL API...")

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

        response = requests.get(url, headers=headers, data=payload, timeout=30)

        if response.status_code == 200:
            response_dict = response.json()
            data_seamen = response_dict.get("data_seamen", [])

            if data_seamen:
                df = pd.DataFrame(data_seamen)
                print(f"DONE - Fetched {len(df)} seamen records from ORIGINAL API")
                return df
            else:
                print("WARNING - ORIGINAL API returned empty data")
                return None
        else:
            print(f"FAIL - ORIGINAL API returned status code {response.status_code}")
            return None

    except Exception as e:
        print(f"FAIL - Error fetching from ORIGINAL API: {str(e)}")
        return None


def fetch_mutations_from_original_api():
    """Fetch data mutations dari API URL ASLI"""
    print(f"START - [{datetime.now()}] Starting mutations sync from ORIGINAL API...")

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

        response = requests.get(url, headers=headers, data=payload, timeout=30)

        if response.status_code == 200:
            response_dict = response.json()
            data_mutation = response_dict.get("data_mutation", [])

            if data_mutation:
                df = pd.DataFrame(data_mutation)
                print(f"DONE - Fetched {len(df)} mutation records from ORIGINAL API")
                return df
            else:
                print("WARNING - ORIGINAL API returned empty data")
                return None
        else:
            print(f"FAIL - ORIGINAL API returned status code {response.status_code}")
            return None

    except Exception as e:
        print(f"FAIL - Error fetching from ORIGINAL API: {str(e)}")
        return None


# ============================================================================
# BAGIAN 3: SYNC KE DATABASE (Untuk Scheduler)
# ============================================================================


def sync_seamen_to_database(df):
    """Simpan/Update data seamen ke Supabase dengan batch insert"""
    if df is None or df.empty:
        print("WARNING - No seamen data to sync")
        return False

    try:
        print(f"PROCESS - Processing {len(df)} seamen records...")

        # Convert date columns dari DD/MM/YYYY ke YYYY-MM-DD
        date_columns = ["start_date", "end_date"]
        for col in date_columns:
            if col in df.columns:
                print(f"Converting {col} format...")
                # Convert DD/MM/YYYY to datetime, then to YYYY-MM-DD
                df[col] = pd.to_datetime(df[col], format="%d/%m/%Y", errors="coerce")

        print("DONE - Date conversion completed")

        with engine.connect() as conn:
            # Set statement timeout lebih tinggi (5 menit)
            print("SETTING - Setting statement timeout to 5 minutes...")
            conn.execute(text("SET statement_timeout = '300000';"))

            # Gunakan DELETE instead of TRUNCATE (lebih reliable, no CASCADE lock)
            print("Starting DELETE operation...")
            conn.execute(text("DELETE FROM seamen"))
            conn.commit()
            print("DONE - DELETE completed")

            # Batch insert untuk data besar
            batch_size = 500
            total_batches = (len(df) + batch_size - 1) // batch_size

            print(f"Starting INSERT operation in {total_batches} batches...")
            for i in range(0, len(df), batch_size):
                batch_df = df.iloc[i : i + batch_size]
                batch_num = (i // batch_size) + 1
                print(
                    f"   Inserting batch {batch_num}/{total_batches} ({len(batch_df)} rows)..."
                )
                batch_df.to_sql("seamen", conn, if_exists="append", index=False)
                conn.commit()

            print("DONE - INSERT completed")
            print(f"DONE - Synced {len(df)} seamen records to database")
            print("=" * 60)

            # Log sync time
            sync_log = {
                "table_name": "seamen",
                "records_synced": len(df),
                "sync_timestamp": datetime.now(),
                "status": "success",
            }
            conn.execute(
                text(
                    """
                INSERT INTO sync_logs (table_name, records_synced, sync_timestamp, status)
                VALUES (:table_name, :records_synced, :sync_timestamp, :status)
            """
                ),
                sync_log,
            )
            conn.commit()

            return True

    except Exception as e:
        print(f"FAIL - Error syncing seamen to database: {str(e)}")
        print("=" * 60)

        # Log error
        try:
            with engine.connect() as conn:
                error_log = {
                    "table_name": "seamen",
                    "records_synced": 0,
                    "sync_timestamp": datetime.now(),
                    "status": "failed",
                    "error_message": str(e)[:500],
                }
                conn.execute(
                    text(
                        """
                    INSERT INTO sync_logs (table_name, records_synced, sync_timestamp, status, error_message)
                    VALUES (:table_name, :records_synced, :sync_timestamp, :status, :error_message)
                """
                    ),
                    error_log,
                )
                conn.commit()
        except Exception:
            pass

        return False


def sync_mutations_to_database(df):
    """Simpan/Update data mutations ke Supabase dengan batch insert"""
    if df is None or df.empty:
        print("WARNING - No mutations data to sync")
        return False

    try:
        print(f"PROCESS - Processing {len(df)} mutation records...")

        # Convert seamancode to integer untuk matching dengan database
        print("Converting seamancode to integer...")
        df["seamancode"] = (
            pd.to_numeric(df["seamancode"], errors="coerce").fillna(0).astype(int)
        )

        # Convert date columns
        if "transactiondate" in df.columns:
            print("Converting transactiondate format...")
            df["transactiondate"] = pd.to_datetime(
                df["transactiondate"], errors="coerce"
            )

        print("DONE - Data conversion completed")

        with engine.connect() as conn:
            # Set statement timeout lebih tinggi (10 menit)
            print("SETTING - Setting statement timeout to 10 minutes...")
            conn.execute(text("SET statement_timeout = '600000';"))

            # Get valid seamancodes from seamen table
            print("FETCHING - Fetching valid seamancodes from seamen table...")
            valid_seamancodes = pd.read_sql_query(
                text("SELECT seamancode FROM seamen"), conn
            )["seamancode"].tolist()
            print(f"   Found {len(valid_seamancodes)} valid seamancodes")

            # Filter mutations to only include valid seamancodes
            original_count = len(df)
            df = df[df["seamancode"].isin(valid_seamancodes)]
            filtered_count = original_count - len(df)

            if filtered_count > 0:
                print(
                    f"WARNING - Filtered out {filtered_count} mutations with invalid seamancode"
                )

            print(f"PROCESS - Proceeding with {len(df)} valid mutation records")

            if len(df) == 0:
                print("WARNING - No valid mutations to insert, skipping...")
                return False

            # Gunakan DELETE instead of TRUNCATE
            print("Starting DELETE operation...")
            conn.execute(text("DELETE FROM mutations"))
            conn.commit()
            print("DONE - DELETE completed")

            # Batch insert untuk data besar
            batch_size = 1000
            total_batches = (len(df) + batch_size - 1) // batch_size

            print(f"Starting INSERT operation in {total_batches} batches...")
            for i in range(0, len(df), batch_size):
                batch_df = df.iloc[i : i + batch_size]
                batch_num = (i // batch_size) + 1
                print(
                    f"   Inserting batch {batch_num}/{total_batches} ({len(batch_df)} rows)..."
                )
                batch_df.to_sql("mutations", conn, if_exists="append", index=False)
                conn.commit()

            print("DONE - INSERT completed")
            print(f"DONE - Synced {len(df)} mutation records to database")
            print("=" * 60)

            # Log sync time
            sync_log = {
                "table_name": "mutations",
                "records_synced": len(df),
                "sync_timestamp": datetime.now(),
                "status": "success",
            }
            conn.execute(
                text(
                    """
                INSERT INTO sync_logs (table_name, records_synced, sync_timestamp, status)
                VALUES (:table_name, :records_synced, :sync_timestamp, :status)
            """
                ),
                sync_log,
            )
            conn.commit()

            return True

    except Exception as e:
        print(f"FAIL - Error syncing mutations to database: {str(e)}")
        print("=" * 60)

        # Log error
        try:
            with engine.connect() as conn:
                error_log = {
                    "table_name": "mutations",
                    "records_synced": 0,
                    "sync_timestamp": datetime.now(),
                    "status": "failed",
                    "error_message": str(e)[:500],
                }
                conn.execute(
                    text(
                        """
                    INSERT INTO sync_logs (table_name, records_synced, sync_timestamp, status, error_message)
                    VALUES (:table_name, :records_synced, :sync_timestamp, :status, :error_message)
                """
                    ),
                    error_log,
                )
                conn.commit()
        except Exception:
            pass

        return False


# ============================================================================
# BAGIAN 4: SCHEDULED JOBS
# ============================================================================


def scheduled_sync_seamen():
    """Job untuk sync seamen - dijalankan setiap 00.01"""
    df = fetch_seamen_from_original_api()
    if df is not None:
        sync_seamen_to_database(df)
    else:
        print("FAIL - Failed to fetch seamen data, skipping sync")


def scheduled_sync_mutations():
    """Job untuk sync mutations - dijalankan setiap 00.01"""
    df = fetch_mutations_from_original_api()
    if df is not None:
        sync_mutations_to_database(df)
    else:
        print("FAIL - Failed to fetch mutations data, skipping sync")


def start_scheduler():
    """Mulai scheduler untuk sync otomatis setiap 00.01"""
    scheduler = BlockingScheduler()

    # Sync seamen setiap pukul 00.01
    scheduler.add_job(
        scheduled_sync_seamen,
        CronTrigger(hour=0, minute=1),
        id="sync_seamen_job",
        name="Sync Seamen Data dari Original API",
        replace_existing=True,
    )

    # Sync mutations setiap pukul 00.01
    scheduler.add_job(
        scheduled_sync_mutations,
        CronTrigger(hour=0, minute=1),
        id="sync_mutations_job",
        name="Sync Mutations Data dari Original API",
        replace_existing=True,
    )

    print("\nDONE - Scheduler started successfully!")
    print("Jobs scheduled:")
    print("   - Seamen sync: Every day at 00:01")
    print("   - Mutations sync: Every day at 00:01")
    print("\nWaiting for scheduled time... (Press Ctrl+C to stop)\n")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\nSTOP - Scheduler stopped by user")


def manual_sync_all():
    """Sync manual semua data (untuk testing)"""
    print("\nManual sync initiated...\n")
    scheduled_sync_seamen()
    scheduled_sync_mutations()
    print("\nDONE - Manual sync completed!\n")


# ============================================================================
# BAGIAN 5: MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--manual":
        # Manual sync untuk testing
        manual_sync_all()
    else:
        # Production: start scheduler
        start_scheduler()
