# @faw_sd
# Database operations, data fetchers, dan CRUD operations

import json
import os
import time
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool



load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
API_BASE_URL_IT = os.getenv("API_BASE_URL_IT")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not found in .env file")

engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)

_seamen_cache = {"df": None, "ts": 0.0}
_SEAMEN_TTL = 30

# ============================================================================
# BAGIAN 1: FETCH DATA DARI SUPABASE (Untuk Frontend/app.py)
# ============================================================================


def get_seamen_as_data(force_refresh=False):
    now = time.time()
    if (
        not force_refresh
        and _seamen_cache["df"] is not None
        and now - _seamen_cache["ts"] < _SEAMEN_TTL
    ):
        return _seamen_cache["df"].copy()

    try:
        query = "SELECT * FROM seamen"
        with engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)
        print(f"DONE - Fetched {len(df)} seamen records from database")
        _seamen_cache["df"] = df
        _seamen_cache["ts"] = now
        return df.copy()
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
# BAGIAN 2: ORPHANED RECORDS MANAGEMENT (Untuk Report Dropped Data)
# ============================================================================


def save_orphaned_records_report(orphaned_records, deleted_count):
    """
    Simpan laporan orphaned mutation records ke file CSV dan TXT
    (Sama seperti migrate.py - hanya simpan ke file, tidak ke database)

    Args:
        orphaned_records: List of tuples (seamancode, seamanname, mutation_count)
        deleted_count: Total jumlah mutation records yang dihapus
    """
    if not orphaned_records:
        print("INFO - No orphaned records to report")
        return True

    try:
        # Create reports directory if not exists (outside backend folder)
        reports_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "reports")
        )
        os.makedirs(reports_dir, exist_ok=True)

        # Generate timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        date_str = datetime.now().strftime("%d %B %Y, %H:%M:%S")

        # Prepare data for CSV
        orphaned_df = pd.DataFrame(
            orphaned_records,
            columns=["seamancode", "seamanname", "mutation_count"],
        )

        # Save to CSV
        csv_filename = f"orphaned_mutations_{timestamp}.csv"
        csv_path = os.path.join(reports_dir, csv_filename)
        orphaned_df.to_csv(csv_path, index=False)

        # Save to TXT with detailed report
        txt_filename = f"orphaned_mutations_{timestamp}.txt"
        txt_path = os.path.join(reports_dir, txt_filename)

        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("=" * 80 + "\n")
            f.write("SYNC REPORT: ORPHANED MUTATION RECORDS\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Generated: {date_str}\n")
            f.write("Sync Script: scheduler.py (scheduled sync)\n\n")
            f.write("-" * 80 + "\n\n")
            f.write("SUMMARY\n")
            f.write("-" * 80 + "\n")
            f.write(f"Total seamen with orphaned records: {len(orphaned_records)}\n")
            f.write(f"Total orphaned mutation records: {deleted_count}\n\n")
            f.write("-" * 80 + "\n\n")
            f.write("DETAILED LIST\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'SeamanCode':<15} {'Name':<40} {'Mutations':<10}\n")
            f.write("-" * 80 + "\n")

            for record in orphaned_records:
                seamancode, seamanname, count = record
                f.write(f"{seamancode:<15} {seamanname:<40} {count:<10}\n")

            f.write("-" * 80 + "\n\n")
            f.write("NOTES\n")
            f.write("-" * 80 + "\n")
            f.write(
                "These seamen have mutation history but do not exist in the current\n"
            )
            f.write("seamen master data. This could mean:\n")
            f.write("1. The seaman has resigned/left the company\n")
            f.write("2. Data synchronization issue between systems\n")
            f.write("3. The seaman data was removed from the source system\n\n")
            f.write("ACTION TAKEN\n")
            f.write("-" * 80 + "\n")
            f.write(
                "All orphaned mutation records have been filtered out during sync\n"
            )
            f.write("to maintain referential integrity.\n\n")
            f.write("RECOMMENDATION\n")
            f.write("-" * 80 + "\n")
            f.write("Contact HR department to verify the status of these seamen and\n")
            f.write("determine if their master data needs to be restored.\n")

        print(f"DONE - Saved {len(orphaned_records)} orphaned records to files")
        print(f"       CSV: {csv_path}")
        print(f"       TXT: {txt_path}")
        print(f"       Total mutations dropped: {deleted_count}")

        return True

    except Exception as e:
        print(f"FAIL - Error saving orphaned records report: {str(e)}")
        return False


# ============================================================================
# BAGIAN 3: LOCKED ROTATIONS MANAGEMENT (Untuk Lock/Unlock Feature)
# ============================================================================


def get_locked_rotations(
    job=None, vessel=None, categorization=None, forecast_month=None
):
    try:
        params = {}
        conditions = ["is_active = TRUE"]

        if job:
            conditions.append("job = :job")
            params["job"] = job

        if vessel:
            conditions.append("vessel = :vessel")
            params["vessel"] = vessel

        if categorization:
            conditions.append("categorization = :categorization")
            params["categorization"] = categorization

        if forecast_month is not None:
            conditions.append("COALESCE(forecast_month, 1) = :forecast_month")
            params["forecast_month"] = forecast_month

        query = f"""
            SELECT id, group_key, job, vessel, categorization, schedule_data, crew_data, reliever_data,
                   locked_seaman_codes, locked_at, locked_by, is_active
            FROM locked_rotation_schedules
            WHERE {' AND '.join(conditions)}
            ORDER BY locked_at DESC
        """

        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            rows = result.fetchall()

        # Convert to list of dicts
        # Parse JSON strings dari TEXT columns
        records = []
        for row in rows:
            records.append(
                {
                    "id": row[0],
                    "group_key": row[1],
                    "job": row[2],
                    "vessel": row[3],
                    "categorization": row[4],
                    "schedule_data": (
                        json.loads(row[5]) if row[5] else None
                    ),  # Parse JSON string
                    "crew_data": (
                        json.loads(row[6]) if row[6] else None
                    ),  # Parse JSON string
                    "reliever_data": (
                        json.loads(row[7]) if row[7] else None
                    ),  # Parse JSON string
                    "locked_seaman_codes": row[8],
                    "locked_at": row[9].isoformat() if row[9] else None,
                    "locked_by": row[10],
                    "is_active": row[11],
                }
            )

        print(f"DONE - Fetched {len(records)} locked rotation records")
        return records

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch locked rotations: {str(e)}")


def save_locked_rotation(
    group_key,
    job,
    vessel,
    schedule_data,
    crew_data,
    reliever_data,
    locked_seaman_codes,
    locked_by=None,
    categorization=None,
    forecast_month=1,
):
    try:
        # Convert dict to JSON string (untuk TEXT column)
        schedule_json = json.dumps(schedule_data)
        crew_json = json.dumps(crew_data)
        reliever_json = json.dumps(reliever_data) if reliever_data else None

        # First, deactivate any existing active lock for this group+job+vessel+forecast_month
        deactivate_query = """
            UPDATE locked_rotation_schedules
            SET is_active = FALSE, unlocked_at = NOW()
            WHERE group_key = :group_key AND job = :job AND vessel = :vessel
              AND COALESCE(forecast_month, 1) = :forecast_month AND is_active = TRUE
        """

        # Then insert new lock
        insert_query = """
            INSERT INTO locked_rotation_schedules
            (group_key, job, vessel, categorization, schedule_data, crew_data, reliever_data,
             locked_seaman_codes, locked_by, is_active, locked_at, forecast_month)
            VALUES (:group_key, :job, :vessel, :categorization, :schedule_data, :crew_data, :reliever_data,
                    :locked_seaman_codes, :locked_by, TRUE, NOW(), :forecast_month)
            RETURNING id
        """

        with engine.connect() as conn:
            # Deactivate existing
            conn.execute(
                text(deactivate_query),
                {
                    "group_key": group_key,
                    "job": job,
                    "vessel": vessel,
                    "forecast_month": forecast_month,
                },
            )

            # Insert new (dengan JSON string, bukan JSONB)
            result = conn.execute(
                text(insert_query),
                {
                    "group_key": group_key,
                    "job": job,
                    "vessel": vessel,
                    "categorization": categorization,
                    "schedule_data": schedule_json,  # JSON string
                    "crew_data": crew_json,  # JSON string
                    "reliever_data": reliever_json,  # JSON string or None
                    "locked_seaman_codes": locked_seaman_codes,
                    "locked_by": locked_by,
                    "forecast_month": forecast_month,
                },
            )

            conn.commit()
            new_id = result.fetchone()[0]

        print(
            f"DONE - Saved locked rotation for {group_key} ({job}, vessel {vessel}, cat {categorization}, forecast_month {forecast_month}) with ID {new_id}"
        )
        return {
            "success": True,
            "message": f"Rotasi untuk {group_key} berhasil di-lock",
            "id": new_id,
        }

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to save locked rotation: {str(e)}")


def unlock_rotation(group_key, job, vessel, forecast_month=1):
    try:
        query = """
            UPDATE locked_rotation_schedules
            SET is_active = FALSE, unlocked_at = NOW()
            WHERE group_key = :group_key AND job = :job AND vessel = :vessel
              AND COALESCE(forecast_month, 1) = :forecast_month AND is_active = TRUE
            RETURNING id
        """

        with engine.connect() as conn:
            result = conn.execute(
                text(query),
                {
                    "group_key": group_key,
                    "job": job,
                    "vessel": vessel,
                    "forecast_month": forecast_month,
                },
            )
            conn.commit()

            unlocked = result.fetchone()

            if unlocked:
                print(
                    f"DONE - Unlocked rotation for {group_key} ({job}, vessel {vessel})"
                )
                return {
                    "success": True,
                    "message": f"Rotasi untuk {group_key} berhasil di-unlock",
                }
            else:
                return {
                    "success": False,
                    "message": f"Tidak ada rotasi aktif untuk {group_key}",
                }

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to unlock rotation: {str(e)}")


def get_all_locked_seaman_codes(job):
    try:
        query = """
            SELECT DISTINCT UNNEST(locked_seaman_codes) as seamancode
            FROM locked_rotation_schedules
            WHERE job = :job AND is_active = TRUE
        """

        with engine.connect() as conn:
            result = conn.execute(text(query), {"job": job})
            codes = [row[0] for row in result.fetchall()]

        print(f"DONE - Found {len(codes)} locked seaman codes for {job}")
        return codes

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch locked seaman codes: {str(e)}")


# ============================================================================
# BAGIAN 4: SYNC KE DATABASE (Untuk Scheduler)
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

            # Identify orphaned records BEFORE filtering
            print("IDENTIFYING - Checking for orphaned mutation records...")
            orphaned_df = df[~df["seamancode"].isin(valid_seamancodes)]

            if len(orphaned_df) > 0:
                # Group by seamancode and get names
                orphaned_summary = (
                    orphaned_df.groupby(["seamancode", "seamanname"])
                    .size()
                    .reset_index(name="mutation_count")
                )

                orphaned_records = [
                    (row["seamancode"], row["seamanname"], row["mutation_count"])
                    for _, row in orphaned_summary.iterrows()
                ]

                print(
                    f"WARNING - Found {len(orphaned_records)} seamen with orphaned mutations"
                )
                print(f"          Total orphaned mutation records: {len(orphaned_df)}")

                # Save orphaned records report to database
                save_orphaned_records_report(orphaned_records, len(orphaned_df))
            else:
                print("INFO - No orphaned mutation records found")

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
# BAGIAN 5: ROTATION SUBMISSIONS MANAGEMENT
# ============================================================================


def submit_all_rotations(job, categorization):
    """
    Submit all locked rotations untuk job tertentu ke rotation_submissions
    dan kirim notifikasi ke API pusat Apollo

    Logic dengan Versioning:
    1. Submit PERTAMA (version 1):
       - Submit semua locked rotations
       - Set version=1, is_active=TRUE, status_data=PENDING

    2. Submit ULANG (version 2+) setelah CHANGE:
       - Hanya submit data yang status_data='CHANGE' dan is_active=FALSE
       - Set version lama is_active=FALSE
       - Insert version baru dengan version+1, is_active=TRUE, status_data=PENDING
       - Kirim notifikasi Apollo hanya untuk data yang berubah

    Args:
        job: Job title (e.g. 'NAKHODA', 'KKM', 'MUALIM I', 'MASINIS II')

    Returns:
        Dict dengan 'success', 'message', dan 'submitted_count'
    """
    try:
        from datetime import datetime, timedelta

        import requests

        # Get all locked rotations for this job (filtered by categorization if provided)
        locked_rotations = get_locked_rotations(job=job, categorization=categorization)

        if not locked_rotations:
            return {
                "success": False,
                "message": f"Tidak ada rotasi yang di-lock untuk job {job}",
                "submitted_count": 0,
            }

        submissions = []
        apollo_notifications = []
        skipped_already_submitted = []

        with engine.connect() as conn:
            trans = conn.begin()

            try:
                for rotation in locked_rotations:
                    group_key = rotation["group_key"]
                    crew_data = rotation["crew_data"]
                    schedule_data = rotation["schedule_data"]
                    reliever_data = rotation.get("reliever_data")

                    if not crew_data:
                        print(f"WARNING - Skipping {group_key}: missing crew data")
                        continue

                    # =========================================================
                    # DETECT JUNIOR vs SENIOR
                    # Junior: crew_data is a LIST (array of crew objects)
                    # Senior: crew_data is a DICT with "columns" and "data" keys
                    # =========================================================
                    is_junior = isinstance(crew_data, list)

                    if is_junior:
                        print(
                            f"INFO - Processing JUNIOR rotation for group {group_key}"
                        )

                        # Junior uses reliever_data: {seamancode_currentCrew: replacement_info}
                        if not reliever_data:
                            print(
                                f"WARNING - Skipping {group_key}: no reliever_data for Junior"
                            )
                            continue

                        for current_crew in crew_data:
                            current_seamancode = current_crew.get("seamancode")
                            # Try both string and int keys for reliever_data lookup
                            replacement = reliever_data.get(
                                str(current_seamancode)
                            ) or reliever_data.get(current_seamancode)

                            if not replacement:
                                print(
                                    f"INFO - No replacement found for seamancode {current_seamancode}, reliever_data keys: {list(reliever_data.keys())}"
                                )
                                continue

                            # Extract replacement data - try multiple key variations
                            seamancode = str(replacement.get("seamancode") or "")
                            nama = str(replacement.get("name") or "")
                            # Try lastVessel, last_vessel, lastLocation, last_location
                            last_location = str(
                                replacement.get("lastVessel")
                                or replacement.get("last_vessel")
                                or replacement.get("lastLocation")
                                or replacement.get("last_location")
                                or ""
                            )
                            mutation_to = str(current_crew.get("currentVessel") or "")
                            start_date = current_crew.get("endDate")

                            print(
                                f"DEBUG - Processing: seamancode={seamancode}, nama={nama}, last_location={last_location}, mutation_to={mutation_to}"
                            )

                            # Check existing submission
                            ck_q = """
                                SELECT id, version, status_data, is_active
                                FROM rotation_submissions
                                WHERE job = :job AND group_key = :group_key AND seamancode = :seamancode
                                AND (is_deleted = FALSE OR is_deleted IS NULL)
                                ORDER BY version DESC LIMIT 1
                            """
                            r = conn.execute(
                                text(ck_q),
                                {
                                    "job": job,
                                    "group_key": group_key,
                                    "seamancode": seamancode,
                                },
                            ).fetchone()

                            ver = 1
                            if r:
                                if r[2] == "CHANGE" and not r[3]:
                                    ver = r[1] + 1
                                elif r[3]:
                                    print(
                                        f"INFO - Skipping {seamancode}: already active"
                                    )
                                    continue  # Already active

                            # Parse start_date
                            sd = start_date
                            if sd and isinstance(sd, str):
                                try:
                                    # Format: "Wed, 04 Mar 2026 17:00:00 GMT"
                                    from email.utils import parsedate_to_datetime

                                    sd = parsedate_to_datetime(sd)
                                except (ValueError, TypeError):
                                    try:
                                        sd = (
                                            datetime.strptime(sd, "%d-%m-%Y")
                                            if "-" in sd
                                            else datetime.strptime(sd, "%d/%m/%Y")
                                        )
                                    except (ValueError, TypeError):
                                        sd = None

                            # Calculate dates (same as Senior: H+6 dari sekarang)
                            tanggal = datetime.now() + timedelta(days=6)
                            tanggal_ready = None  # Kosong, diisi manual
                            auto_accept_at = datetime.now() + timedelta(days=6)

                            # Insert submission
                            ins_q = """
                                INSERT INTO rotation_submissions
                                (job, group_key, seamancode, nama, last_location, mutation_from, mutation_to,
                                 start_date, tanggal, tanggal_ready, auto_accept_at,
                                 version, status_data, is_active, categorization, created_at)
                                VALUES (:job, :group_key, :seamancode, :nama, :last_location, :mutation_from, :mutation_to,
                                 :start_date, :tanggal, :tanggal_ready, :auto_accept_at,
                                 :version, 'PENDING', TRUE, :categorization, NOW())
                                RETURNING id
                            """
                            conn.execute(
                                text(ins_q),
                                {
                                    "job": job,
                                    "group_key": group_key,
                                    "seamancode": seamancode,
                                    "nama": nama,
                                    "last_location": last_location,
                                    "mutation_from": last_location,  # mutation_from = last_location (where replacement comes from)
                                    "mutation_to": mutation_to,
                                    "start_date": sd,
                                    "tanggal": tanggal,
                                    "tanggal_ready": tanggal_ready,
                                    "auto_accept_at": auto_accept_at,
                                    "version": ver,
                                    "categorization": categorization,
                                },
                            )
                            apollo_notifications.append(
                                {
                                    "seamancode": seamancode,
                                    "tanggal": tanggal.strftime("%d-%m-%Y"),
                                    "mutationfrom": last_location,
                                    "mutationto": mutation_to,
                                }
                            )
                            submissions.append({"seamancode": seamancode})

                        continue  # Skip Senior Logic for this rotation

                    # =========================================================
                    # SENIOR ROTATION LOGIC (Data is Dict/Grid)
                    # =========================================================
                    if not schedule_data:
                        print(f"WARNING - Skipping {group_key}: missing schedule data")
                        continue

                    crew_rows = crew_data.get("data", [])
                    if not crew_rows:
                        print(f"WARNING - Skipping {group_key}: no crew data")
                        continue

                    last_crew = crew_rows[-1]  # Ambil yang paling bawah

                    # Extract data dari last_crew
                    seamancode = str(
                        last_crew.get("seamancode")
                        or last_crew.get("SEAMANCODE")
                        or last_crew.get("Seamancode")
                        or last_crew.get("SeamanCode")
                        or ""
                    )
                    nama = str(last_crew.get("name") or last_crew.get("NAME") or "")
                    last_location = str(
                        last_crew.get("last_location")
                        or last_crew.get("LAST_LOCATION")
                        or ""
                    )
                    start_date = last_crew.get("start_date") or last_crew.get(
                        "START_DATE"
                    )
                    end_date = last_crew.get("end_date") or last_crew.get("END_DATE")
                    crew_index = str(
                        last_crew.get("Index") or last_crew.get("INDEX") or ""
                    )

                    # Find mutation_to from schedule_data
                    # Cari ship pertama kali yang dinaiki berdasarkan crew_index
                    mutation_to = None
                    first_rotation_date = None

                    schedule_rows = schedule_data.get("data", [])
                    for ship_row in schedule_rows:
                        ship_name = ship_row.get("Ship") or ship_row.get("SHIP")

                        # Check all month columns untuk crew_index
                        for col_name, col_value in ship_row.items():
                            if col_name in ["Ship", "SHIP", "First Rotation Date"]:
                                continue

                            # Bersihkan value dari " (transaction)"
                            clean_value = (
                                str(col_value).replace(" (transaction)", "").strip()
                            )

                            # Jika match dengan crew_index
                            if clean_value == crew_index:
                                mutation_to = ship_name
                                first_rotation_date = ship_row.get(
                                    "First Rotation Date"
                                ) or ship_row.get("FIRST ROTATION DATE")
                                break

                        if mutation_to:
                            break

                    if not mutation_to:
                        print(
                            f"WARNING - Skipping {seamancode}: cannot find mutation_to"
                        )
                        continue

                    # Cek berdasarkan JOB + GROUP_KEY (bukan seamancode!)
                    # Karena saat CHANGE, seamannya bisa berbeda (diganti)
                    # PENTING: Cek juga is_deleted untuk menentukan apakah ini batch baru
                    check_query = """
                        SELECT id, version, status_data, is_active, seamancode, is_deleted
                        FROM rotation_submissions
                        WHERE job = :job
                        AND group_key = :group_key
                        AND (is_deleted = FALSE OR is_deleted IS NULL)
                        ORDER BY version DESC
                        LIMIT 1
                    """
                    check_result = conn.execute(
                        text(check_query),
                        {"job": job, "group_key": group_key},
                    )
                    existing_record = check_result.fetchone()

                    # Debug log
                    if existing_record:
                        print(
                            f"DEBUG - Found existing record for {job} {group_key}: seaman={existing_record[4]}, version={existing_record[1]}, status={existing_record[2]}, active={existing_record[3]}, deleted={existing_record[5]}"
                        )
                    else:
                        print(
                            f"DEBUG - No existing record for {job} {group_key} (atau sudah di-soft delete)"
                        )

                    # Tentukan apakah perlu submit atau skip
                    should_submit = False
                    new_version = 1

                    if existing_record:
                        old_version = existing_record[1]
                        old_status = existing_record[2]
                        old_is_active = existing_record[3]
                        old_seamancode = existing_record[4]

                        # Seamancode bisa berbeda karena diganti
                        if old_status == "CHANGE" and not old_is_active:
                            should_submit = True
                            new_version = old_version + 1
                            print(
                                f"INFO - Resubmitting {job} {group_key}: CHANGE detected (old: {old_seamancode}, new: {seamancode}), version {old_version} -> {new_version}"
                            )
                        elif old_is_active and old_status in ["PENDING", "ACCEPTED"]:
                            print(
                                f"INFO - Skipping {job} {group_key}: already submitted with {old_seamancode} (version {old_version}, status {old_status})"
                            )
                            skipped_already_submitted.append(
                                f"{seamancode} ({group_key})"
                            )
                            continue
                        # ✅ Jika ada record tapi bukan CHANGE dan tidak aktif -> error case
                        else:
                            print(
                                f"WARNING - Unexpected state for {job} {group_key}: status={old_status}, active={old_is_active}, treating as new"
                            )
                            should_submit = True
                            new_version = old_version + 1
                    else:
                        # ✅ Data baru ATAU batch baru setelah soft delete
                        # Jika semua record sebelumnya is_deleted=TRUE, maka ini submit pertama untuk batch baru
                        should_submit = True
                        new_version = 1
                        print(
                            f"INFO - New submission for {job} {group_key} with {seamancode} ({nama}): version 1 (batch baru)"
                        )

                    if not should_submit:
                        continue

                    # Parse dates
                    try:
                        # Convert start_date dan end_date ke datetime jika masih string
                        if isinstance(start_date, str):
                            # Try parsing different formats
                            for fmt in [
                                "%d/%m/%Y",
                                "%Y-%m-%d",
                                "%a, %d %b %Y %H:%M:%S %Z",
                            ]:
                                try:
                                    start_date = datetime.strptime(start_date, fmt)
                                    break
                                except ValueError:
                                    continue

                        if isinstance(end_date, str):
                            for fmt in [
                                "%d/%m/%Y",
                                "%Y-%m-%d",
                                "%a, %d %b %Y %H:%M:%S %Z",
                            ]:
                                try:
                                    end_date = datetime.strptime(end_date, fmt)
                                    break
                                except ValueError:
                                    continue

                        if isinstance(first_rotation_date, str):
                            # Format: "01-12-2025"
                            try:
                                first_rotation_date = datetime.strptime(
                                    first_rotation_date, "%d-%m-%Y"
                                )
                            except ValueError:
                                first_rotation_date = None

                    except Exception as e:
                        print(f"WARNING - Date parsing error for {seamancode}: {e}")

                    # Calculate dates
                    tanggal = datetime.now() + timedelta(days=6)  # H+6 dari created_at
                    tanggal_ready = None  # Kosong dulu, nanti diisi manual
                    auto_accept_at = datetime.now() + timedelta(
                        days=6
                    )  # H+6 dari created_at, sama dengan tanggal

                    # Insert ke rotation_submissions dengan versioning
                    insert_query = """
                        INSERT INTO rotation_submissions
                        (job, group_key, seamancode, nama, last_location, mutation_from, mutation_to,
                         start_date, end_date, first_rotation_date, tanggal, tanggal_ready,
                         auto_accept_at, status_data, version, is_active, categorization)
                        VALUES (:job, :group_key, :seamancode, :nama, :last_location, :mutation_from,
                                :mutation_to, :start_date, :end_date, :first_rotation_date, :tanggal,
                                :tanggal_ready, :auto_accept_at, :status_data, :version, :is_active, :categorization)
                        RETURNING id
                    """

                    result = conn.execute(
                        text(insert_query),
                        {
                            "job": job,
                            "group_key": group_key,
                            "seamancode": seamancode,
                            "nama": nama,
                            "last_location": last_location,
                            "mutation_from": last_location,
                            "mutation_to": mutation_to,
                            "start_date": start_date,
                            "end_date": end_date,
                            "first_rotation_date": first_rotation_date,
                            "tanggal": tanggal,
                            "tanggal_ready": tanggal_ready,
                            "auto_accept_at": auto_accept_at,
                            "status_data": "PENDING",
                            "version": new_version,
                            "is_active": True,
                            "categorization": categorization,
                        },
                    )

                    submission_id = result.fetchone()[0]
                    submissions.append(submission_id)

                    # Prepare data untuk Apollo API
                    apollo_notifications.append(
                        {
                            "seamancode": seamancode,
                            "tanggal": tanggal.strftime(
                                "%d-%m-%Y"
                            ),  # Gunakan tanggal, bukan tanggal_ready
                            "mutationfrom": last_location,
                            "mutationto": mutation_to,
                        }
                    )

                    print(
                        f"DONE - Submitted {seamancode} ({nama}) version {new_version} to {mutation_to} (status: PENDING, is_active: TRUE)"
                    )

                # Commit semua submissions
                trans.commit()

                print(
                    f"DONE - Submitted {len(submissions)} rotations to rotation_submissions"
                )

                # Save apollo_notifications to test file for debugging
                import json
                import os

                # Create data directory if not exists
                data_dir = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)), "data"
                )
                os.makedirs(data_dir, exist_ok=True)

                test_file_path = os.path.join(data_dir, "../../data/test-submit.json")

                # Prepare test data with metadata
                test_data = {
                    "job": job,
                    "total_submissions": len(submissions),
                    "timestamp": datetime.now().isoformat(),
                    "apollo_notifications": apollo_notifications,
                }

                # Write to file
                with open(test_file_path, "w", encoding="utf-8") as f:
                    json.dump(test_data, f, indent=2, ensure_ascii=False)

                print(f"DONE - Saved Apollo notification data to {test_file_path}")

                # Kirim ke Apollo API
                apollo_success = 0
                apollo_failed = 0

                for notif in apollo_notifications:
                    try:
                        # Kirim ke Apollo API pusat
                        response = requests.post(
                            f"{API_BASE_URL_IT}/pe/ins-rotation-notif",
                            json=notif,
                            timeout=10,
                        )

                        if response.status_code == 200:
                            apollo_success += 1
                            print(
                                f"DONE - Sent notification to Apollo for {notif['seamancode']}"
                            )
                        else:
                            apollo_failed += 1
                            print(
                                f"WARNING - Failed to send notification to Apollo for {notif['seamancode']}: {response.status_code}"
                            )

                    except Exception as e:
                        apollo_failed += 1
                        print(
                            f"WARNING - Error sending notification to Apollo for {notif['seamancode']}: {e}"
                        )

                # Generate message
                message_parts = []
                if len(submissions) > 0:
                    message_parts.append(
                        f"Successfully submitted {len(submissions)} new rotation(s)"
                    )
                if len(skipped_already_submitted) > 0:
                    message_parts.append(
                        f"Skipped {len(skipped_already_submitted)} already submitted rotation(s)"
                    )
                if apollo_success > 0 or apollo_failed > 0:
                    message_parts.append(
                        f"Apollo notifications: {apollo_success} success, {apollo_failed} failed"
                    )

                final_message = ". ".join(message_parts) + "."

                return {
                    "success": True,
                    "message": final_message,
                    "submitted_count": len(submissions),
                    "skipped_count": len(skipped_already_submitted),
                    "apollo_success": apollo_success,
                    "apollo_failed": apollo_failed,
                }

            except Exception as e:
                trans.rollback()
                raise e

    except Exception as e:
        print(f"FAIL - Error submitting rotations: {str(e)}")
        raise Exception(f"Failed to submit rotations: {str(e)}")


def get_rotation_submissions(job=None):
    """
    Get all rotation submissions, optionally filtered by job

    Args:
        job: Optional job filter (e.g. 'NAKHODA', 'KKM')

    Returns:
        List of submission records
    """
    try:
        if job:
            query = """
                SELECT id, job, categorization, group_key, seamancode, nama, last_location,
                       mutation_from, mutation_to, start_date, end_date,
                       first_rotation_date, tanggal, tanggal_ready, auto_accept_at,
                       status_data, created_at, updated_at, stage
                FROM rotation_submissions
                WHERE job = :job AND (is_deleted = FALSE OR is_deleted IS NULL)
                ORDER BY created_at DESC
            """
            with engine.connect() as conn:
                result = conn.execute(text(query), {"job": job})
                rows = result.fetchall()
        else:
            query = """
                SELECT id, job, categorization, group_key, seamancode, nama, last_location,
                       mutation_from, mutation_to, start_date, end_date,
                       first_rotation_date, tanggal, tanggal_ready, auto_accept_at,
                       status_data, created_at, updated_at, stage
                FROM rotation_submissions
                WHERE is_deleted = FALSE OR is_deleted IS NULL
                ORDER BY created_at DESC
            """
            with engine.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()

        # Convert to list of dicts
        records = []
        for row in rows:
            records.append(
                {
                    "id": row[0],
                    "job": row[1],
                    "categorization": row[2],
                    "group_key": row[3],
                    "seamancode": row[4],
                    "nama": row[5],
                    "last_location": row[6],
                    "mutation_from": row[7],
                    "mutation_to": row[8],
                    "start_date": row[9].isoformat() if row[9] else None,
                    "end_date": row[10].isoformat() if row[10] else None,
                    "first_rotation_date": row[11].isoformat() if row[11] else None,
                    "tanggal": row[12].isoformat() if row[12] else None,
                    "tanggal_ready": row[13].isoformat() if row[13] else None,
                    "auto_accept_at": row[14].isoformat() if row[14] else None,
                    "status_data": row[15],
                    "created_at": row[16].isoformat() if row[16] else None,
                    "updated_at": row[17].isoformat() if row[17] else None,
                    "stage": row[18],
                }
            )

        print(f"DONE - Fetched {len(records)} submission records")
        return records

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch rotation submissions: {str(e)}")


def get_all_rotation_submissions(job=None):
    """
    Get ALL rotation submissions including soft-deleted ones, optionally filtered by job

    Args:
        job: Optional job filter (e.g. 'NAKHODA', 'KKM')

    Returns:
        List of submission records (including soft-deleted)
    """
    try:
        if job:
            query = """
                SELECT id, job, categorization, group_key, seamancode, nama, last_location,
                       mutation_from, mutation_to, start_date, end_date,
                       first_rotation_date, tanggal, tanggal_ready, auto_accept_at,
                       status_data, created_at, updated_at, stage
                FROM rotation_submissions
                WHERE job = :job
                ORDER BY created_at DESC
            """
            with engine.connect() as conn:
                result = conn.execute(text(query), {"job": job})
                rows = result.fetchall()
        else:
            query = """
                SELECT id, job, categorization, group_key, seamancode, nama, last_location,
                       mutation_from, mutation_to, start_date, end_date,
                       first_rotation_date, tanggal, tanggal_ready, auto_accept_at,
                       status_data, created_at, updated_at, stage
                FROM rotation_submissions
                ORDER BY created_at DESC
            """
            with engine.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()

        # Convert to list of dicts
        records = []
        for row in rows:
            records.append(
                {
                    "id": row[0],
                    "job": row[1],
                    "categorization": row[2],
                    "group_key": row[3],
                    "seamancode": row[4],
                    "nama": row[5],
                    "last_location": row[6],
                    "mutation_from": row[7],
                    "mutation_to": row[8],
                    "start_date": row[9].isoformat() if row[9] else None,
                    "end_date": row[10].isoformat() if row[10] else None,
                    "first_rotation_date": row[11].isoformat() if row[11] else None,
                    "tanggal": row[12].isoformat() if row[12] else None,
                    "tanggal_ready": row[13].isoformat() if row[13] else None,
                    "auto_accept_at": row[14].isoformat() if row[14] else None,
                    "status_data": row[15],
                    "created_at": row[16].isoformat() if row[16] else None,
                    "updated_at": row[17].isoformat() if row[17] else None,
                    "stage": row[18],
                }
            )

        print(
            f"DONE - Fetched {len(records)} submission records (including soft-deleted)"
        )
        return records

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch all rotation submissions: {str(e)}")


def check_job_submitted(job, vessel=None, categorization=None):
    """
    Check if ALL locked rotations for a job have been submitted

    Logic dengan Versioning:
    - Get all locked rotation group_keys for this job and vessel/categorization
    - Check if ALL of them exist in rotation_submissions dengan is_active = TRUE
    - Return True only if ALL locked rotations have been submitted dengan status aktif
    - Status CHANGE dengan is_active = FALSE tidak dianggap submitted

    Args:
        job: Job title
        vessel: Vessel name (optional, for Senior)
        categorization: Categorization (optional, for Junior - e.g., 'container', 'manalagi')

    Returns:
        Boolean - True jika SEMUA locked rotations sudah di-submit dengan is_active = TRUE
    """
    try:
        # Get all locked rotations for this job and vessel/categorization
        locked_rotations = get_locked_rotations(
            job=job, vessel=vessel, categorization=categorization
        )

        if not locked_rotations or len(locked_rotations) == 0:
            # Tidak ada rotations yang di-lock, anggap belum submitted
            return False

        # Get group_keys yang di-lock
        locked_group_keys = [rotation["group_key"] for rotation in locked_rotations]

        # Check berapa banyak yang sudah ada di rotation_submissions
        with engine.connect() as conn:
            # Query untuk hitung group_keys yang sudah di-submit
            # PENTING: Hanya hitung yang belum di-soft delete
            placeholders = ", ".join(
                [f":key{i}" for i in range(len(locked_group_keys))]
            )
            query = f"""
                SELECT COUNT(DISTINCT group_key)
                FROM rotation_submissions
                WHERE job = :job
                AND group_key IN ({placeholders})
                AND is_active = TRUE
                AND (is_deleted = FALSE OR is_deleted IS NULL)
            """

            # Prepare parameters
            params = {"job": job}
            for i, key in enumerate(locked_group_keys):
                params[f"key{i}"] = key

            result = conn.execute(text(query), params)
            submitted_count = result.fetchone()[0]

        # Return True jika SEMUA locked rotations sudah di-submit
        all_submitted = submitted_count == len(locked_group_keys)

        if all_submitted:
            print(
                f"INFO - All {len(locked_group_keys)} locked rotations for {job} have been submitted"
            )
        else:
            print(
                f"INFO - Only {submitted_count}/{len(locked_group_keys)} locked rotations for {job} have been submitted"
            )

        return all_submitted

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        return False


def check_has_pending_changes(job, vessel=None, categorization=None):
    """
    Check if there are any rotation submissions with status CHANGE and is_active = FALSE
    yang perlu di-resubmit, KECUALI jika sudah ada version lebih tinggi dengan is_active = TRUE

    Logic:
    - Cari semua data dengan status CHANGE dan is_active = FALSE
    - Filter: hanya ambil yang BELUM punya version lebih tinggi dengan is_active = TRUE
    - Filter by vessel/categorization untuk memisahkan CONTAINER dan MANALAGI
    - Filter: hanya data yang is_deleted = FALSE
    - Return: count dan affected_groups yang benar-benar perlu resubmit

    Args:
        job: Job title
        vessel: Vessel name (optional, for Senior)
        categorization: Categorization (optional, for Junior - e.g., 'container', 'manalagi')

    Returns:
        Dict dengan has_changes (boolean), count (int), dan affected_groups (list)
    """
    try:
        with engine.connect() as conn:
            # Get all locked group_keys for this job and vessel/categorization
            locked_rotations = get_locked_rotations(
                job=job, vessel=vessel, categorization=categorization
            )
            if not locked_rotations:
                return {"has_changes": False, "count": 0, "affected_groups": []}

            locked_group_keys = [rotation["group_key"] for rotation in locked_rotations]

            # Get count and affected groups
            # HANYA ambil CHANGE yang BELUM di-resubmit (belum ada version lebih tinggi)
            # DAN hanya untuk group_keys yang di-lock untuk vessel ini
            # DAN hanya yang tidak di-soft delete
            placeholders = ", ".join(
                [f":key{i}" for i in range(len(locked_group_keys))]
            )
            query = f"""
                SELECT
                    COUNT(DISTINCT rs_change.group_key) as total_count,
                    ARRAY_AGG(DISTINCT rs_change.group_key) as groups
                FROM rotation_submissions rs_change
                WHERE rs_change.job = :job
                AND rs_change.group_key IN ({placeholders})
                AND rs_change.status_data = 'CHANGE'
                AND rs_change.is_active = FALSE
                AND (rs_change.is_deleted = FALSE OR rs_change.is_deleted IS NULL)
                AND NOT EXISTS (
                    SELECT 1
                    FROM rotation_submissions rs_newer
                    WHERE rs_newer.job = rs_change.job
                    AND rs_newer.group_key = rs_change.group_key
                    AND rs_newer.version > rs_change.version
                    AND rs_newer.is_active = TRUE
                    AND (rs_newer.is_deleted = FALSE OR rs_newer.is_deleted IS NULL)
                )
            """

            # Prepare parameters
            params = {"job": job}
            for i, key in enumerate(locked_group_keys):
                params[f"key{i}"] = key

            result = conn.execute(text(query), params)
            row = result.fetchone()

            count = row[0] if row[0] else 0
            affected_groups = row[1] if row[1] else []

            if count > 0:
                print(
                    f"INFO - Found {count} pending changes for {job} ({vessel}) in groups: {affected_groups}"
                )

                # Debug: Show details of pending changes (only those without newer versions)
                debug_query = f"""
                    SELECT rs_change.seamancode, rs_change.group_key,
                           rs_change.status_data, rs_change.is_active, rs_change.version
                    FROM rotation_submissions rs_change
                    WHERE rs_change.job = :job
                    AND rs_change.group_key IN ({placeholders})
                    AND rs_change.status_data = 'CHANGE'
                    AND rs_change.is_active = FALSE
                    AND (rs_change.is_deleted = FALSE OR rs_change.is_deleted IS NULL)
                    AND NOT EXISTS (
                        SELECT 1
                        FROM rotation_submissions rs_newer
                        WHERE rs_newer.job = rs_change.job
                        AND rs_newer.group_key = rs_change.group_key
                        AND rs_newer.version > rs_change.version
                        AND rs_newer.is_active = TRUE
                        AND (rs_newer.is_deleted = FALSE OR rs_newer.is_deleted IS NULL)
                    )
                    ORDER BY rs_change.group_key, rs_change.seamancode
                """
                debug_result = conn.execute(text(debug_query), params)
                for row in debug_result.fetchall():
                    print(
                        f"  - seaman {row[0]}: {row[1]}, status={row[2]}, active={row[3]}, version={row[4]}"
                    )
            else:
                print(f"INFO - No pending changes for {job}")

            return {
                "has_changes": count > 0,
                "count": count,
                "affected_groups": affected_groups,
            }

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        return {"has_changes": False, "count": 0, "affected_groups": []}


def get_submitted_seamancodes(job):
    """
    Get list of seamancodes yang sudah di-submit untuk job tertentu
    dan masih berstatus aktif (PENDING, CHANGE, ACCEPTED) dan belum ready

    Logic:
    - Return seamancodes yang:
      1. Status = PENDING/CHANGE/ACCEPTED (bukan REJECTED/REPLACED)
      2. tanggal_ready NULL ATAU belum lewat

    Args:
        job: Job title (e.g. 'NAKHODA', 'KKM')

    Returns:
        List of seamancodes yang harus di-exclude dari selection
    """
    try:
        # PENTING: Hanya ambil seamancodes dari data yang BELUM di-soft delete
        query = """
            SELECT DISTINCT seamancode
            FROM rotation_submissions
            WHERE job = :job
            AND status_data IN ('PENDING', 'CHANGE', 'ACCEPTED')
            AND (tanggal_ready IS NULL OR tanggal_ready > NOW())
            AND (is_deleted = FALSE OR is_deleted IS NULL)
        """

        with engine.connect() as conn:
            result = conn.execute(text(query), {"job": job})
            seamancodes = [row[0] for row in result.fetchall()]

        print(
            f"INFO - Found {len(seamancodes)} submitted seamancodes for {job} to exclude"
        )
        return seamancodes

    except Exception as e:
        print(f"FAIL - Error fetching submitted seamancodes: {str(e)}")
        return []


def update_rotation_status_change(seamancode, tanggal_ready, stage):
    """
    Update rotation submission status berdasarkan request dari tim pusat.

    Logic:
    1. Find rotation dengan seamancode yang di-CHANGE
    2. Update seamancode tersebut menjadi status CHANGE
    3. Update semua rotation lain dalam group yang sama (created_at sama) menjadi ACCEPTED

    Args:
        seamancode: Seamancode yang request CHANGE
        tanggal_ready: Tanggal ready dari tim pusat (format: DD-MM-YYYY)
        stage: Stage dari tim pusat (string)

    Returns:
        Dict dengan 'success', 'message', dan detail perubahan
    """
    try:
        from datetime import datetime

        # Parse tanggal_ready dari DD-MM-YYYY ke datetime
        try:
            tanggal_ready_dt = datetime.strptime(tanggal_ready, "%d-%m-%Y")
        except ValueError:
            raise ValueError(
                f"Invalid tanggal_ready format: {tanggal_ready}. Expected DD-MM-YYYY"
            )

        with engine.connect() as conn:
            trans = conn.begin()

            try:
                # 1. Find rotation dengan seamancode ini (ambil yang is_active = TRUE dan version tertinggi)
                # PENTING: Hanya cari di data yang BELUM di-soft delete
                find_query = """
                    SELECT id, job, group_key, created_at, status_data, version
                    FROM rotation_submissions
                    WHERE seamancode = :seamancode
                    AND is_active = TRUE
                    AND (is_deleted = FALSE OR is_deleted IS NULL)
                    ORDER BY version DESC
                    LIMIT 1
                """
                result = conn.execute(text(find_query), {"seamancode": seamancode})
                target_rotation = result.fetchone()

                if not target_rotation:
                    return {
                        "success": False,
                        "message": f"Seamancode {seamancode} tidak ditemukan di rotation_submissions",
                    }

                rotation_id = target_rotation[0]
                job = target_rotation[1]
                group_key = target_rotation[2]
                created_at = target_rotation[3]
                current_version = target_rotation[5]

                print(
                    f"INFO - Found seamancode {seamancode}: version {current_version}, will set to CHANGE and is_active=FALSE"
                )

                # 2. Update seamancode tersebut menjadi CHANGE dan set is_active = FALSE
                update_change_query = """
                    UPDATE rotation_submissions
                    SET status_data = 'CHANGE',
                        tanggal_ready = :tanggal_ready,
                        auto_accept_at = :auto_accept_at,
                        stage = :stage,
                        is_active = FALSE,
                        updated_at = NOW()
                    WHERE id = :rotation_id
                """
                conn.execute(
                    text(update_change_query),
                    {
                        "rotation_id": rotation_id,
                        "tanggal_ready": tanggal_ready_dt,
                        "auto_accept_at": tanggal_ready_dt,
                        "stage": stage,
                    },
                )

                print(
                    f"DONE - Updated seamancode {seamancode} to CHANGE with tanggal_ready {tanggal_ready}"
                )

                # 3. Update semua rotation lain dalam batch yang sama (created_at sama) menjadi ACCEPTED
                # Hanya update yang masih PENDING dan BELUM di-soft delete
                update_accepted_query = """
                    UPDATE rotation_submissions
                    SET status_data = 'ACCEPTED',
                        updated_at = NOW()
                    WHERE job = :job
                      AND created_at = :created_at
                      AND seamancode != :seamancode
                      AND status_data = 'PENDING'
                      AND (is_deleted = FALSE OR is_deleted IS NULL)
                    RETURNING seamancode, nama
                """
                accepted_result = conn.execute(
                    text(update_accepted_query),
                    {
                        "job": job,
                        "created_at": created_at,
                        "seamancode": seamancode,
                    },
                )
                accepted_rows = accepted_result.fetchall()
                accepted_count = len(accepted_rows)

                if accepted_count > 0:
                    print(
                        f"DONE - Auto-accepted {accepted_count} other rotations in the same batch"
                    )
                    for row in accepted_rows:
                        print(f"       - {row[0]} ({row[1]})")

                trans.commit()

                return {
                    "success": True,
                    "message": f"Status updated successfully. {seamancode} set to CHANGE, {accepted_count} others set to ACCEPTED.",
                    "changed_seamancode": seamancode,
                    "tanggal_ready": tanggal_ready,
                    "accepted_count": accepted_count,
                    "job": job,
                    "group_key": group_key,
                    "stage": stage,
                }

            except Exception as e:
                trans.rollback()
                raise e

    except ValueError as e:
        print(f"FAIL - Validation Error: {str(e)}")
        raise ValueError(str(e))
    except Exception as e:
        print(f"FAIL - Error updating rotation status: {str(e)}")
        raise Exception(f"Failed to update rotation status: {str(e)}")


def auto_accept_expired_rotations():
    """
    Auto-accept semua rotation submissions yang sudah melewati auto_accept_at
    dan masih berstatus PENDING.

    Fungsi ini dipanggil setiap kali ada request ke API change-schedule-rotation
    untuk memastikan rotations yang expired otomatis di-accept.

    Returns:
        Dict dengan jumlah rotations yang di-auto-accept
    """
    try:
        with engine.connect() as conn:
            # Update semua PENDING yang sudah lewat auto_accept_at
            query = """
                UPDATE rotation_submissions
                SET status_data = 'ACCEPTED',
                    updated_at = NOW()
                WHERE status_data = 'PENDING'
                  AND auto_accept_at <= NOW()
                RETURNING id, seamancode, nama, job
            """
            result = conn.execute(text(query))
            conn.commit()

            auto_accepted = result.fetchall()
            count = len(auto_accepted)

            if count > 0:
                print(f"DONE - Auto-accepted {count} expired rotation submissions")
                for row in auto_accepted:
                    print(f"       - ID {row[0]}: {row[1]} ({row[2]}) - {row[3]}")
            else:
                print("INFO - No expired rotations to auto-accept")

            return {
                "success": True,
                "auto_accepted_count": count,
                "auto_accepted_list": [
                    {
                        "id": row[0],
                        "seamancode": row[1],
                        "nama": row[2],
                        "job": row[3],
                    }
                    for row in auto_accepted
                ],
            }

    except Exception as e:
        print(f"FAIL - Error auto-accepting expired rotations: {str(e)}")
        return {"success": False, "auto_accepted_count": 0, "error": str(e)}


def soft_delete_rotation_and_reset_locks():
    """
    Soft delete SEMUA rotation submission dan reset SEMUA locked_rotation_schedule.

    Logic:
    1. Set is_deleted = TRUE untuk SEMUA rotation_submissions
    2. Hapus SEMUA locked_rotation_schedule

    Returns:
        Dict dengan 'success', 'message', dan detail operasi
    """
    try:
        with engine.connect() as conn:
            trans = conn.begin()

            try:
                # 1. Soft delete ALL rotation submissions
                delete_query = """
                    UPDATE rotation_submissions
                    SET is_deleted = TRUE,
                        updated_at = NOW()
                    WHERE is_deleted = FALSE OR is_deleted IS NULL
                    RETURNING id, seamancode, nama, job
                """
                result = conn.execute(text(delete_query))
                deleted_rows = result.fetchall()
                deleted_count = len(deleted_rows)

                print(f"INFO - Soft deleted {deleted_count} rotation submissions")
                for row in deleted_rows:
                    print(f"       - ID {row[0]}: {row[1]} ({row[2]}) - {row[3]}")

                # 2. Delete ALL locked_rotation_schedules
                reset_query = """
                    DELETE FROM locked_rotation_schedules
                """
                result = conn.execute(text(reset_query))
                reset_count = result.rowcount

                print(f"INFO - Deleted {reset_count} locked rotation schedules")

                trans.commit()

                return {
                    "success": True,
                    "message": f"Successfully soft deleted ALL {deleted_count} rotation(s) and reset ALL {reset_count} locked schedule(s)",
                    "deleted_count": deleted_count,
                    "reset_count": reset_count,
                }

            except Exception as e:
                trans.rollback()
                raise e

    except Exception as e:
        print(f"FAIL - Error in soft delete and reset: {str(e)}")
        raise Exception(f"Failed to soft delete and reset: {str(e)}")


# ============================================================================
# BAGIAN 6: ROTATION VESSELS MANAGEMENT (CRUD)
# ============================================================================

# Validation Constants - Easy to update without database migration
VALID_VESSELS = ["D", "E", "F", "G"]
VALID_TYPES = ["senior", "junior", "manalagi"]
VALID_PARTS = ["deck", "engine"]


def validate_rotation_vessel(vessel, rotation_type, part, groups=None):
    """
    Validate rotation vessel data before insert/update

    Args:
        vessel: Vessel code
        rotation_type: Type (container/schedule)
        part: Part (deck/engine)
        groups: Optional groups dict for additional validation

    Raises:
        ValueError: If validation fails

    Returns:
        True if all validations pass
    """
    # Validate vessel
    if vessel not in VALID_VESSELS:
        raise ValueError(f"Invalid vessel: '{vessel}'. Must be one of {VALID_VESSELS}")

    # Validate type
    if rotation_type not in VALID_TYPES:
        raise ValueError(
            f"Invalid type: '{rotation_type}'. Must be one of {VALID_TYPES}"
        )

    # Validate part
    if part not in VALID_PARTS:
        raise ValueError(f"Invalid part: '{part}'. Must be one of {VALID_PARTS}")

    # Optional: Validate groups structure
    if groups is not None:
        if not isinstance(groups, dict):
            raise ValueError("Groups must be a dictionary")

        if len(groups) == 0:
            raise ValueError("At least one group is required")

        for group_key, ships in groups.items():
            if not isinstance(ships, list):
                raise ValueError(f"Ships in '{group_key}' must be a list")

            if len(ships) == 0:
                raise ValueError(f"Group '{group_key}' must contain at least one ship")

    return True


def get_rotation_vessels(rotation_type=None, categorization=None):
    """
    Fetch rotation vessels dari database dengan groups dan ships

    Args:
        rotation_type: Optional filter by type ('senior', 'junior')
        categorization: Optional filter by categorization ('container', 'manalagi', 'bc')

    Returns:
        List of dicts dengan struktur:
        {
            'id': int,
            'job_title': str,
            'vessel': str,
            'type': str,
            'part': str,
            'categorization': str,
            'groups': {
                'container_rotation1': ['KM. SHIP1', 'KM. SHIP2'],
                'container_rotation2': ['KM. SHIP3', 'KM. SHIP4']
            }
        }
    """
    try:
        # Build query dengan optional filters
        where_clauses = []
        params = {}

        if rotation_type:
            where_clauses.append("type = :rotation_type")
            params["rotation_type"] = rotation_type

        if categorization:
            where_clauses.append("categorization = :categorization")
            params["categorization"] = categorization

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        query = f"""
            SELECT id, job_title, vessel, type, part, categorization, created_at, updated_at
            FROM vessels
            WHERE {where_sql}
            ORDER BY job_title
        """

        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            configs = result.fetchall()

        # Convert to list of dicts dengan groups
        vessel_list = []
        with engine.connect() as conn:
            for vessel_row in configs:
                vessel_id = vessel_row[0]

                # Fetch groups untuk vessel ini
                groups_query = """
                    SELECT id, group_key, group_number
                    FROM vessels_groups
                    WHERE vessel_id = :vessel_id
                    ORDER BY group_number
                """
                groups_result = conn.execute(
                    text(groups_query), {"vessel_id": vessel_id}
                )
                groups = groups_result.fetchall()

                # Build groups dict
                groups_dict = {}
                for group in groups:
                    group_id = group[0]
                    group_key = group[1]

                    # Fetch ships berdasarkan group_id
                    ships_query = """
                        SELECT ship_name
                        FROM vessels_ships
                        WHERE group_id = :group_id
                        ORDER BY order_index
                    """
                    ships_result = conn.execute(
                        text(ships_query), {"group_id": group_id}
                    )
                    ships = [row[0] for row in ships_result.fetchall()]

                    groups_dict[group_key] = ships

                # Build vessel dict
                vessel_dict = {
                    "id": vessel_row[0],
                    "job_title": vessel_row[1],
                    "vessel": vessel_row[2],
                    "type": vessel_row[3],
                    "part": vessel_row[4],
                    "categorization": vessel_row[5],
                    "groups": groups_dict,
                    "created_at": vessel_row[6].isoformat() if vessel_row[6] else None,
                    "updated_at": vessel_row[7].isoformat() if vessel_row[7] else None,
                }

                vessel_list.append(vessel_dict)

        print(f"DONE - Fetched {len(vessel_list)} rotation vessels from database")
        return vessel_list

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch rotation vessels: {str(e)}")


def get_rotation_vessel_by_id(vessel_id):
    """
    Fetch single rotation vessel by ID

    Args:
        vessel_id: ID of the vessel

    Returns:
        Dict dengan struktur sama seperti get_rotation_vessels
    """
    try:
        query = """
            SELECT id, job_title, vessel, type, part, categorization, created_at, updated_at
            FROM vessels
            WHERE id = :vessel_id
        """

        with engine.connect() as conn:
            result = conn.execute(text(query), {"vessel_id": vessel_id})
            vessel_row = result.fetchone()

            if not vessel_row:
                return None

            # Fetch groups
            groups_query = """
                SELECT id, group_key, group_number
                FROM vessels_groups
                WHERE vessel_id = :vessel_id
                ORDER BY group_number
            """
            groups_result = conn.execute(text(groups_query), {"vessel_id": vessel_id})
            groups = groups_result.fetchall()

            # Build groups dict
            groups_dict = {}
            for group in groups:
                group_id = group[0]
                group_key = group[1]

                # Fetch ships berdasarkan group_id
                ships_query = """
                    SELECT ship_name
                    FROM vessels_ships
                    WHERE group_id = :group_id
                    ORDER BY order_index
                """
                ships_result = conn.execute(text(ships_query), {"group_id": group_id})
                ships = [row[0] for row in ships_result.fetchall()]

                groups_dict[group_key] = ships

            vessel_dict = {
                "id": vessel_row[0],
                "job_title": vessel_row[1],
                "vessel": vessel_row[2],
                "type": vessel_row[3],
                "part": vessel_row[4],
                "categorization": vessel_row[5],
                "groups": groups_dict,
                "created_at": vessel_row[6].isoformat() if vessel_row[6] else None,
                "updated_at": vessel_row[7].isoformat() if vessel_row[7] else None,
            }

            print(f"DONE - Fetched rotation vessel ID {vessel_id}")
            return vessel_dict

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to fetch rotation vessel: {str(e)}")


def create_rotation_vessel(
    job_title, vessel, rotation_type=None, part=None, groups=None, categorization=None, **kwargs
):
    """
    Legacy wrapper delegating to authoritative create_rotation_vessel_with_role.
    Derives role classification authoritatively from role_settings, ignoring caller-provided rotation_type.
    """
    return create_rotation_vessel_with_role(
        job_title=job_title,
        vessel=vessel,
        part=part,
        groups=groups,
        categorization=categorization,
    )


def update_rotation_vessel(
    vessel_id, job_title, vessel, rotation_type=None, part=None, groups=None, categorization=None, group_key_renames=None, **kwargs
):
    """
    Legacy wrapper delegating to authoritative update_rotation_vessel_with_role.
    Derives role classification authoritatively from role_settings, ignoring caller-provided rotation_type.
    """
    return update_rotation_vessel_with_role(
        vessel_id=vessel_id,
        job_title=job_title,
        vessel=vessel,
        part=part,
        groups=groups,
        categorization=categorization,
        group_key_renames=group_key_renames,
    )


def create_rotation_vessel_with_role(
    job_title, vessel, part, groups, categorization=None
):
    """
    Create new rotation vessel dengan klasifikasi role dari role_settings dalam SATU transaksi atomik.
    Mengunci baris role_settings dengan FOR UPDATE terlebih dahulu untuk memastikan konsistensi
    dan mencegah race condition dengan role mutation.

    Args:
        job_title: Job title (e.g. 'mualimI', 'KKM')
        vessel: Vessel code ('D', 'E', 'F', 'G')
        part: Part ('deck' atau 'engine')
        groups: Dict groups dan ships
        categorization: 'container', 'manalagi', atau 'bc'

    Returns:
        Dict dengan success, id, type, dan message
    """
    from repositories.role_repository import (
        CANONICAL_POSITION_MAP,
        VALID_CATEGORIES,
        VALID_POSITIONS,
        get_position_classification,
        RoleIntegrityError,
    )

    cat = (categorization or "container").lower().strip()
    norm_pos = CANONICAL_POSITION_MAP.get(job_title.strip().lower())
    if not norm_pos:
        raise ValueError(f"Invalid position '{job_title}'. Must be one of {list(VALID_POSITIONS)}")
    if cat not in VALID_CATEGORIES:
        raise ValueError(f"Invalid categorization '{categorization}'. Must be one of {list(VALID_CATEGORIES)}")

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Lock role_settings row to get authoritative role_type
            authoritative_type = get_position_classification(
                categorization=cat,
                position=norm_pos,
                conn=conn,
                for_update=True,
            )

            # 2. Validate rotation vessel schema & groups
            validate_rotation_vessel(vessel, authoritative_type, part, groups)

            # 3. Insert vessel
            vessel_query = """
                INSERT INTO vessels (job_title, vessel, type, part, categorization)
                VALUES (:job_title, :vessel, :type, :part, :categorization)
                RETURNING id
            """
            result = conn.execute(
                text(vessel_query),
                {
                    "job_title": norm_pos,
                    "vessel": vessel,
                    "type": authoritative_type,
                    "part": part,
                    "categorization": cat,
                },
            )
            vessel_id = result.fetchone()[0]

            # 4. Insert groups dan ships
            for group_key, ships in groups.items():
                group_number = int("".join(filter(str.isdigit, group_key)))
                group_query = """
                    INSERT INTO vessels_groups (vessel_id, group_key, group_number)
                    VALUES (:vessel_id, :group_key, :group_number)
                    RETURNING id
                """
                group_result = conn.execute(
                    text(group_query),
                    {
                        "vessel_id": vessel_id,
                        "group_key": group_key,
                        "group_number": group_number,
                    },
                )
                group_id = group_result.fetchone()[0]

                for idx, ship_name in enumerate(ships):
                    ship_query = """
                        INSERT INTO vessels_ships (group_id, ship_name, order_index)
                        VALUES (:group_id, :ship_name, :order_index)
                    """
                    conn.execute(
                        text(ship_query),
                        {
                            "group_id": group_id,
                            "ship_name": ship_name,
                            "order_index": idx,
                        },
                    )

            trans.commit()
            print(f"DONE - Created rotation vessel '{norm_pos}' with ID {vessel_id} (type: {authoritative_type})")
            return {
                "success": True,
                "message": f"Konfigurasi rotasi {norm_pos} berhasil di-create",
                "id": vessel_id,
                "type": authoritative_type,
            }
        except (ValueError, RoleIntegrityError):
            trans.rollback()
            raise
        except Exception as e:
            trans.rollback()
            print(f"FAIL - Error in create_rotation_vessel_with_role: {str(e)}")
            raise


def update_rotation_vessel_with_role(
    vessel_id, job_title, vessel, part, groups, categorization=None, group_key_renames=None
):
    """
    Update existing rotation vessel dengan klasifikasi role dari role_settings dalam SATU transaksi atomik.
    Mengunci baris role_settings terlebih dahulu (FOR UPDATE), lalu mengunci dan mengupdate vessels.
    """
    from repositories.role_repository import (
        CANONICAL_POSITION_MAP,
        VALID_CATEGORIES,
        VALID_POSITIONS,
        get_position_classification,
        RoleIntegrityError,
    )

    cat = (categorization or "container").lower().strip()
    norm_pos = CANONICAL_POSITION_MAP.get(job_title.strip().lower())
    if not norm_pos:
        raise ValueError(f"Invalid position '{job_title}'. Must be one of {list(VALID_POSITIONS)}")
    if cat not in VALID_CATEGORIES:
        raise ValueError(f"Invalid categorization '{categorization}'. Must be one of {list(VALID_CATEGORIES)}")

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Lock role_settings row to get authoritative role_type
            authoritative_type = get_position_classification(
                categorization=cat,
                position=norm_pos,
                conn=conn,
                for_update=True,
            )

            # 2. Validate rotation vessel schema & groups
            validate_rotation_vessel(vessel, authoritative_type, part, groups)

            # 3. Lock & verify existing vessel row
            vessel_check = conn.execute(
                text("SELECT id FROM vessels WHERE id = :vessel_id FOR UPDATE"),
                {"vessel_id": vessel_id},
            ).fetchone()
            if not vessel_check:
                raise ValueError(f"Rotation vessel with ID {vessel_id} not found")

            # 4. Update main vessel
            query = """
                UPDATE vessels
                SET job_title = :job_title, vessel = :vessel, type = :type,
                    part = :part, categorization = :categorization, updated_at = NOW()
                WHERE id = :vessel_id
            """
            conn.execute(
                text(query),
                {
                    "vessel_id": vessel_id,
                    "job_title": norm_pos,
                    "vessel": vessel,
                    "type": authoritative_type,
                    "part": part,
                    "categorization": cat,
                },
            )

            # 5. Handle group_key_renames
            if group_key_renames:
                def extract_num(key):
                    import re
                    m = re.search(r'(\d+)$', key)
                    return int(m.group(1)) if m else 0

                sorted_renames = sorted(
                    group_key_renames.items(),
                    key=lambda item: extract_num(item[0]),
                    reverse=True,
                )

                rename_query = """
                    UPDATE locked_rotation_schedules
                    SET group_key = :new_key, updated_at = NOW()
                    WHERE group_key = :old_key
                      AND categorization = :categorization
                """
                for old_key, new_key in sorted_renames:
                    conn.execute(
                        text(rename_query),
                        {
                            "old_key": old_key,
                            "new_key": new_key,
                            "categorization": cat,
                        },
                    )

            # 6. Delete existing groups (ships will cascade)
            conn.execute(
                text("DELETE FROM vessels_groups WHERE vessel_id = :vessel_id"),
                {"vessel_id": vessel_id},
            )

            # 7. Re-insert groups and ships
            for group_key, ships in groups.items():
                group_number = int("".join(filter(str.isdigit, group_key)))
                group_query = """
                    INSERT INTO vessels_groups (vessel_id, group_key, group_number)
                    VALUES (:vessel_id, :group_key, :group_number)
                    RETURNING id
                """
                group_result = conn.execute(
                    text(group_query),
                    {
                        "vessel_id": vessel_id,
                        "group_key": group_key,
                        "group_number": group_number,
                    },
                )
                group_id = group_result.fetchone()[0]

                for idx, ship_name in enumerate(ships):
                    ship_query = """
                        INSERT INTO vessels_ships (group_id, ship_name, order_index)
                        VALUES (:group_id, :ship_name, :order_index)
                    """
                    conn.execute(
                        text(ship_query),
                        {
                            "group_id": group_id,
                            "ship_name": ship_name,
                            "order_index": idx,
                        },
                    )

            trans.commit()
            print(f"DONE - Updated rotation vessel ID {vessel_id} (type: {authoritative_type})")
            return {
                "success": True,
                "message": f"Konfigurasi rotasi {norm_pos} berhasil diupdate",
                "type": authoritative_type,
            }
        except (ValueError, RoleIntegrityError):
            trans.rollback()
            raise
        except Exception as e:
            trans.rollback()
            print(f"FAIL - Error in update_rotation_vessel_with_role: {str(e)}")
            raise


def delete_rotation_vessel(vessel_id):
    """
    Delete rotation vessel (CASCADE akan handle groups dan ships)

    Args:
        vessel_id: ID of vessel to delete

    Returns:
        Dict dengan 'success'
    """
    try:
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                # CASCADE akan otomatis hapus groups dan ships jika FK di-set CASCADE
                query = "DELETE FROM vessels WHERE id = :vessel_id"
                conn.execute(text(query), {"vessel_id": vessel_id})
                trans.commit()

                print(f"DONE - Deleted rotation vessel ID {vessel_id}")
                return {
                    "success": True,
                    "message": "Konfigurasi rotasi berhasil dihapus",
                }
            except Exception as e:
                trans.rollback()
                raise e

    except Exception as e:
        print(f"FAIL - Database Error: {str(e)}")
        raise Exception(f"Failed to delete rotation vessel: {str(e)}")
