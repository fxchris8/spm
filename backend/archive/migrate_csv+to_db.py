# @faw_sd
# Untuk migrasi data dari CSV ke database Supabase

import os
from datetime import datetime

import pandas as pd
from sqlalchemy import text

from database import engine, test_connection


def clean_phone_number(phone):
    if pd.isna(phone) or phone == "-" or phone == "":
        return None
    return str(phone).strip()


def parse_date(date_str):
    """Parse berbagai format tanggal"""
    if pd.isna(date_str) or date_str == "" or date_str == "-":
        return None

    # Try ISO format first (untuk mutations: 2020-01-01T00:00:00Z)
    try:
        if "T" in str(date_str):
            return pd.to_datetime(date_str, errors="coerce")
    except Exception as e:
        print(f"Error parsing date: {e}")
        pass

    # Try DD/MM/YYYY format (untuk seamen: 25/06/2026)
    try:
        return pd.to_datetime(date_str, format="%d/%m/%Y", errors="coerce")
    except Exception as e:
        print(f"Error parsing date: {e}")
        pass

    # Fallback: let pandas figure it out
    try:
        return pd.to_datetime(date_str, errors="coerce")
    except Exception as e:
        print(f"Error parsing date: {e}")
        pass
        return None


def migrate():
    print("=" * 60)
    print("MIGRATING CSV TO SUPABASE")
    print("=" * 60)

    if not test_connection():
        return False

    try:
        # ============================================
        # 0. DROP EXISTING TABLES (with CASCADE)
        # ============================================
        print("\n[0/5] Dropping existing tables...")
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS mutations CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS seamen CASCADE"))
            conn.commit()
        print("Old tables dropped")

        # ============================================
        # 1. SEAMEN DATA
        # ============================================
        print("\n[1/5] Migrating Seamen...")
        df_seamen = pd.read_csv("../data/Data_Seamen_API.csv")

        # Clean data
        if "start_date" in df_seamen.columns:
            df_seamen["start_date"] = df_seamen["start_date"].apply(parse_date)
        if "end_date" in df_seamen.columns:
            df_seamen["end_date"] = df_seamen["end_date"].apply(parse_date)

        for i in range(1, 5):
            col = f"phone_number_{i}"
            if col in df_seamen.columns:
                df_seamen[col] = df_seamen[col].apply(clean_phone_number)

        df_seamen["seamancode"] = df_seamen["seamancode"].astype(int)
        df_seamen.to_sql("seamen", engine, if_exists="append", index=False)
        print(f"{len(df_seamen)} records")

        # ============================================
        # 2. MUTATIONS DATA
        # ============================================
        print("\n[2/5] Migrating Mutations...")
        df_mutations = pd.read_csv("../data/Data_Mutasi_API.csv")

        if "transactiondate" in df_mutations.columns:
            df_mutations["transactiondate"] = df_mutations["transactiondate"].apply(
                parse_date
            )

        df_mutations["seamancode"] = df_mutations["seamancode"].astype(int)
        df_mutations.to_sql("mutations", engine, if_exists="append", index=False)
        print(f"{len(df_mutations)} records")

        # ============================================
        # 3. ADD PRIMARY KEYS & FOREIGN KEYS
        # ============================================
        print("\n[3/5] Adding constraints...")

        with engine.connect() as conn:
            # Primary keys dulu
            try:
                conn.execute(
                    text(
                        "ALTER TABLE seamen ADD CONSTRAINT pk_seamen PRIMARY KEY (seamancode)"
                    )
                )
                print("Primary key on seamen.seamancode")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("seamen primary key already exists")

            try:
                conn.execute(
                    text(
                        "ALTER TABLE mutations ADD CONSTRAINT pk_mutations PRIMARY KEY (mutationnoid)"
                    )
                )
                print("Primary key on mutations.mutationnoid")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("mutations primary key already exists")

            conn.commit()

            # IDENTIFY orphaned records
            print("Checking for orphaned mutation records...")
            check_query = text(
                """
                SELECT DISTINCT m.seamancode, m.seamanname, COUNT(*) as mutation_count
                FROM mutations m
                WHERE m.seamancode NOT IN (SELECT seamancode FROM seamen)
                GROUP BY m.seamancode, m.seamanname
                ORDER BY m.seamancode
            """
            )
            orphaned_records = conn.execute(check_query).fetchall()

            if orphaned_records:
                # Create reports directory if not exists
                reports_dir = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "data", "reports")
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
                    f.write("MIGRATION REPORT: ORPHANED MUTATION RECORDS\n")
                    f.write("=" * 80 + "\n\n")
                    f.write(f"Generated: {date_str}\n")
                    f.write("Migration Script: migrate.py\n\n")
                    f.write("-" * 80 + "\n\n")
                    f.write("SUMMARY\n")
                    f.write("-" * 80 + "\n")
                    f.write(
                        f"Total seamen with orphaned records: {len(orphaned_records)}\n"
                    )
                    f.write(
                        f"Total orphaned mutation records: {sum(r[2] for r in orphaned_records)}\n\n"
                    )
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
                        "These seamen have mutation history in the database but do not exist\n"
                    )
                    f.write("in the current seamen master data. This could mean:\n")
                    f.write("1. The seaman has resigned/left the company\n")
                    f.write("2. Data synchronization issue between systems\n")
                    f.write("3. The seaman data was removed from the source system\n\n")
                    f.write("ACTION TAKEN\n")
                    f.write("-" * 80 + "\n")
                    f.write(
                        "All orphaned mutation records have been deleted to maintain\n"
                    )
                    f.write(
                        "referential integrity and enable foreign key constraints.\n\n"
                    )
                    f.write("RECOMMENDATION\n")
                    f.write("-" * 80 + "\n")
                    f.write(
                        "Contact HR department to verify the status of these seamen and\n"
                    )
                    f.write("determine if their master data needs to be restored.\n")

                total_mutations = sum(r[2] for r in orphaned_records)
                print(
                    f"Found {len(orphaned_records)} seamen with {total_mutations} orphaned mutations"
                )
                print(f"Report saved to: {csv_path}")
                print(f"Details saved to: {txt_path}")

                # Delete orphaned records
                print("Deleting orphaned mutation records...")
                cleanup_query = text(
                    """
                    DELETE FROM mutations 
                    WHERE seamancode NOT IN (SELECT seamancode FROM seamen)
                """
                )
                result = conn.execute(cleanup_query)
                deleted_count = result.rowcount
                conn.commit()
                print(f"Deleted {deleted_count} orphaned mutation records")
            else:
                print("No orphaned records found")

            # Add foreign key
            try:
                conn.execute(
                    text(
                        """
                    ALTER TABLE mutations
                    ADD CONSTRAINT fk_mutations_seamancode
                    FOREIGN KEY (seamancode) 
                    REFERENCES seamen(seamancode)
                    ON DELETE CASCADE
                """
                    )
                )
                print("Foreign key: mutations.seamancode → seamen.seamancode")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("foreign key already exists")
                else:
                    print(f"   Failed to add foreign key: {e}")

            conn.commit()

        # ============================================
        # 4. CREATE INDEXES
        # ============================================
        print("\n[4/5] Creating indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_seamen_position ON seamen(last_position)",
            "CREATE INDEX IF NOT EXISTS idx_seamen_location ON seamen(last_location)",
            "CREATE INDEX IF NOT EXISTS idx_seamen_certificate ON seamen(certificate)",
            "CREATE INDEX IF NOT EXISTS idx_seamen_status ON seamen(status)",
            "CREATE INDEX IF NOT EXISTS idx_seamen_day_remains ON seamen(day_remains)",
            "CREATE INDEX IF NOT EXISTS idx_mutations_seamancode ON mutations(seamancode)",
            "CREATE INDEX IF NOT EXISTS idx_mutations_date ON mutations(transactiondate)",
            "CREATE INDEX IF NOT EXISTS idx_mutations_fromvessel ON mutations(fromvesselname)",
            "CREATE INDEX IF NOT EXISTS idx_mutations_tovessel ON mutations(tovesselname)",
        ]

        with engine.connect() as conn:
            for idx_sql in indexes:
                conn.execute(text(idx_sql))
            conn.commit()
        print("All indexes created")

        # ============================================
        # 5. VERIFY
        # ============================================
        print("\n[5/5] Verifying migration...")
        with engine.connect() as conn:
            seamen_count = conn.execute(text("SELECT COUNT(*) FROM seamen")).scalar()
            mutations_count = conn.execute(
                text("SELECT COUNT(*) FROM mutations")
            ).scalar()

            # Verify constraints
            constraints_query = text(
                """
                SELECT COUNT(*) 
                FROM pg_constraint con
                JOIN pg_class rel ON con.conrelid = rel.oid
                WHERE rel.relname IN ('seamen', 'mutations')
            """
            )
            constraints_count = conn.execute(constraints_query).scalar()

            print(f"Seamen: {seamen_count} rows")
            print(f"Mutations: {mutations_count} rows")
            print(f"Constraints: {constraints_count} active")

        print("\n" + "=" * 60)
        print("MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        return True

    except FileNotFoundError as e:
        print(f"\nCSV file not found: {e}")
        print("Please ensure these files exist in ../data/ folder:")
        print("Data_Seamen_API.csv")
        print("Data_Mutasi_API.csv")
        return False
    except Exception as e:
        print(f"\nMigration failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    migrate()
