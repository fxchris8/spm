"""
Module ini menangani operasi database untuk sinkronisasi data dari API eksternal,
meliputi data seamen dan mutasi beserta pencatatan log sinkronisasi.
"""

from datetime import datetime

import pandas as pd
from sqlalchemy import text

from database.database import get_db_connection


def sync_seamen_to_database(df):
    """
    Sync seamen data to database using direct SQL queries.

    Args:
        df: DataFrame containing seamen data

    Returns:
        bool: True if sync successful, False otherwise
    """
    if df is None or df.empty:
        print("WARNING - No seamen data to sync")
        return False

    try:
        print(f"PROCESS - Processing {len(df)} seamen records...")

        date_columns = ["start_date", "end_date"]
        for col in date_columns:
            if col in df.columns:
                print(f"Converting {col} format...")
                df[col] = pd.to_datetime(df[col], format="%d/%m/%Y", errors="coerce")

        print("DONE - Date conversion completed")

        with get_db_connection() as conn:
            print("SETTING - Setting statement timeout to 5 minutes...")
            conn.execute(text("SET statement_timeout = '300000';"))

            print("Starting DELETE operation...")
            conn.execute(text("DELETE FROM seamen"))
            conn.commit()
            print("DONE - DELETE completed")

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

        try:
            with get_db_connection() as conn:
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
    """
    Sync mutations data to database using direct SQL queries.

    Args:
        df: DataFrame containing mutations data

    Returns:
        bool: True if sync successful, False otherwise
    """
    if df is None or df.empty:
        print("WARNING - No mutations data to sync")
        return False

    try:
        print(f"PROCESS - Processing {len(df)} mutation records...")

        print(f"Converting seamancode to integer...")
        df["seamancode"] = (
            pd.to_numeric(df["seamancode"], errors="coerce").fillna(0).astype(int)
        )

        if "transactiondate" in df.columns:
            print("Converting transactiondate format...")
            df["transactiondate"] = pd.to_datetime(
                df["transactiondate"], errors="coerce"
            )

        print("DONE - Data conversion completed")

        with get_db_connection() as conn:
            print("SETTING - Setting statement timeout to 10 minutes...")
            conn.execute(text("SET statement_timeout = '600000';"))

            print("FETCHING - Fetching valid seamancodes from seamen table...")
            valid_seamancodes = pd.read_sql_query(
                text("SELECT seamancode FROM seamen"), conn
            )["seamancode"].tolist()
            print(f"   Found {len(valid_seamancodes)} valid seamancodes")

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

            conn.execute(text("DELETE FROM mutations"))
            conn.commit()
            print("DONE - DELETE completed")

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

        try:
            with get_db_connection() as conn:
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
