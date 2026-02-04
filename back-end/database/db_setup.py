# @faw_sd
# Script untuk membuat database dan semua tabel yang dibutuhkan

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
POSTGRES_URL = os.getenv("POSTGRES_URL")
DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 60)
print("DATABASE INITIALIZATION")
print("=" * 60)
print(f"Database Name: {DB_NAME}")
print(f"Host: {DB_HOST}:{DB_PORT}")
print(f"User: {DB_USER}")
print("=" * 60)

# ============================================================================
# SQL SCRIPTS
# ============================================================================

# Create database
CREATE_DATABASE_SQL = f"""
-- Create database if not exists
SELECT 'CREATE DATABASE "{DB_NAME}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '{DB_NAME}');
"""

# Table: seamen
CREATE_TABLE_SEAMEN = """
-- Table: seamen
CREATE TABLE IF NOT EXISTS seamen (
    seamancode int4 PRIMARY KEY,
    age int8,
    certificate text,
    day_remains int8,
    edu_level text,
    end_date timestamptz,
    experience text,
    gender text,
    is_active_employee text,
    last_location text,
    last_position text,
    name text,
    no int8,
    phone_number_1 text,
    phone_number_2 text,
    phone_number_3 text,
    phone_number_4 text,
    seafarercode float8,
    start_date timestamptz,
    status text,
    birthdate text,
    birthplace text,
    day_elapsed int8,
    fleet text,
    last_vesselid text,
    pic_crewing text,
    prevlocation text,
    prevposition text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_talent boolean DEFAULT false
);

-- Indexes for seamen
CREATE INDEX IF NOT EXISTS idx_seamen_status ON seamen(status);
CREATE INDEX IF NOT EXISTS idx_seamen_last_position ON seamen(last_position);
CREATE INDEX IF NOT EXISTS idx_seamen_name ON seamen(name);
"""

# Table: mutations
CREATE_TABLE_MUTATIONS = """
-- Table: mutations
CREATE TABLE IF NOT EXISTS mutations (
    mutationnoid int8 PRIMARY KEY,
    fromrankcode text,
    fromrankname text,
    fromvesselcode text,
    fromvesselname text,
    jenis text,
    seamancode int4,
    seamanname text,
    torankcode text,
    torankname text,
    tovesselcode text,
    tovesselname text,
    transactiondate timestamptz,
    created_at timestamptz DEFAULT now(),
    
    -- Foreign Key Constraint (nullable untuk konsistensi)
    CONSTRAINT fk_mutations_seaman 
        FOREIGN KEY (seamancode) 
        REFERENCES seamen(seamancode)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Indexes for mutations
CREATE INDEX IF NOT EXISTS idx_mutations_seamancode ON mutations(seamancode);
CREATE INDEX IF NOT EXISTS idx_mutations_transactiondate ON mutations(transactiondate);
CREATE INDEX IF NOT EXISTS idx_mutations_jenis ON mutations(jenis);
"""

# Table: locked_rotation_schedules
CREATE_TABLE_LOCKED_ROTATIONS = """
-- Table: locked_rotation_schedules
CREATE TABLE IF NOT EXISTS locked_rotation_schedules (
    id SERIAL PRIMARY KEY,
    group_key VARCHAR(255),
    job VARCHAR(50),
    vessel VARCHAR(50),
    categorization VARCHAR(100),
    schedule_data TEXT,
    crew_data TEXT,
    reliever_data TEXT,
    locked_seaman_codes TEXT[],
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_by VARCHAR(255),
    unlocked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for locked_rotation_schedules
CREATE INDEX IF NOT EXISTS idx_locked_rotation_locked_seaman_code
    ON locked_rotation_schedules USING GIN(locked_seaman_codes);
CREATE INDEX IF NOT EXISTS idx_locked_rotation_is_active
    ON locked_rotation_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_locked_rotation_job
    ON locked_rotation_schedules(job);
CREATE INDEX IF NOT EXISTS idx_locked_rotation_group_key
    ON locked_rotation_schedules(group_key);
CREATE INDEX IF NOT EXISTS idx_locked_rotation_categorization
    ON locked_rotation_schedules(categorization);
"""

# Table: sync_logs
CREATE_TABLE_SYNC_LOGS = """
-- Table: sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    records_synced INTEGER,
    sync_timestamp TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_table_name ON sync_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(sync_timestamp DESC);

-- View: latest sync status
CREATE OR REPLACE VIEW v_latest_sync AS
SELECT DISTINCT ON (table_name)
    table_name,
    sync_timestamp,
    records_synced,
    status,
    error_message
FROM sync_logs
ORDER BY table_name, sync_timestamp DESC;
"""

# Table: vessels
CREATE_TABLE_VESSELS = """
-- Table: vessels
CREATE TABLE IF NOT EXISTS vessels (
    id BIGSERIAL PRIMARY KEY,
    job_title VARCHAR(50),
    categorization VARCHAR(100),
    vessel VARCHAR(10),
    type VARCHAR(20),
    part VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(job_title, type, categorization)
);

-- Index for vessels
CREATE INDEX IF NOT EXISTS idx_vessels_type ON vessels(type);
CREATE INDEX IF NOT EXISTS idx_vessels_job_title ON vessels(job_title);
"""

# Table: vessels_groups
CREATE_TABLE_VESSELS_GROUPS = """
-- Table: vessels_groups
CREATE TABLE IF NOT EXISTS vessels_groups (
    id BIGSERIAL PRIMARY KEY,
    vessel_id BIGINT,
    group_key VARCHAR(50),
    group_number INT CHECK (group_number > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_vessels_groups_vessel
        FOREIGN KEY (vessel_id)
        REFERENCES vessels(id)
        ON DELETE CASCADE,

    UNIQUE(vessel_id, group_key)
);

-- Index for vessels_groups
CREATE INDEX IF NOT EXISTS idx_vessels_groups_vessel ON vessels_groups(vessel_id);
"""

# Table: vessels_ships
CREATE_TABLE_VESSELS_SHIPS = """
-- Table: vessels_ships
CREATE TABLE IF NOT EXISTS vessels_ships (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT,
    ship_name VARCHAR(100),
    order_index INT CHECK (order_index >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_vessels_ships_group
        FOREIGN KEY (group_id)
        REFERENCES vessels_groups(id)
        ON DELETE CASCADE,

    UNIQUE(group_id, ship_name)
);

-- Index for vessels_ships
CREATE INDEX IF NOT EXISTS idx_vessels_ships_group ON vessels_ships(group_id);
"""

# Table: rotation_submissions
CREATE_TABLE_ROTATION_SUBMISSIONS = """
-- Table: rotation_submissions
CREATE TABLE IF NOT EXISTS rotation_submissions (
    id SERIAL PRIMARY KEY,
    job VARCHAR(50),
    categorization VARCHAR(50),
    group_key VARCHAR(100),
    seamancode VARCHAR(100),
    nama VARCHAR(255),
    last_location VARCHAR(255),
    mutation_from VARCHAR(255),
    mutation_to VARCHAR(255),
    start_date DATE,
    end_date DATE,
    first_rotation_date DATE,
    tanggal DATE,
    tanggal_ready DATE,
    auto_accept_at TIMESTAMP,
    status_data VARCHAR(100) DEFAULT 'PENDING',
    version INT,
    is_active BOOLEAN DEFAULT TRUE,
    stage VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rotation_submissions
CREATE INDEX IF NOT EXISTS idx_rotation_job ON rotation_submissions (job);
CREATE INDEX IF NOT EXISTS idx_rotation_categorization ON rotation_submissions (categorization);
CREATE INDEX IF NOT EXISTS idx_rotation_group_key ON rotation_submissions (group_key);
CREATE INDEX IF NOT EXISTS idx_rotation_seamancode ON rotation_submissions (seamancode);
CREATE INDEX IF NOT EXISTS idx_rotation_status ON rotation_submissions (status_data);
CREATE INDEX IF NOT EXISTS idx_rotation_tanggal ON rotation_submissions (tanggal);
"""

# ============================================================================
# INITIALIZATION FUNCTIONS
# ============================================================================


def create_database():
    """Create database if not exists"""
    try:
        print("\n[1/9] Creating database...")
        engine = create_engine(
            POSTGRES_URL, poolclass=NullPool, isolation_level="AUTOCOMMIT"
        )

        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            )
            exists = result.fetchone()

            if not exists:
                conn.execute(text(f'CREATE DATABASE "{DB_NAME}"'))
                print(f"[SUCCES] Database '{DB_NAME}' created successfully")
            else:
                print(f"[SUCCES] Database '{DB_NAME}' already exists")

        engine.dispose()
        return True

    except Exception as e:
        print(f"[FAILED] Error creating database: {str(e)}")
        return False


def create_tables():
    """Create all tables and indexes"""
    try:
        engine = create_engine(DATABASE_URL, poolclass=NullPool)

        tables = [
            ("seamen", CREATE_TABLE_SEAMEN),
            ("mutations", CREATE_TABLE_MUTATIONS),
            ("locked_rotation_schedules", CREATE_TABLE_LOCKED_ROTATIONS),
            ("sync_logs", CREATE_TABLE_SYNC_LOGS),
            ("vessels", CREATE_TABLE_VESSELS),
            ("vessels_groups", CREATE_TABLE_VESSELS_GROUPS),
            ("vessels_ships", CREATE_TABLE_VESSELS_SHIPS),
            ("rotation_submissions", CREATE_TABLE_ROTATION_SUBMISSIONS),
        ]

        with engine.connect() as conn:
            for idx, (table_name, sql) in enumerate(tables, start=2):
                print(f"\n[{idx}/9] Creating table: {table_name}...")
                conn.execute(text(sql))
                conn.commit()
                print(f"[SUCCES] Table '{table_name}' created successfully")

        engine.dispose()
        return True

    except Exception as e:
        print(f"[FAILED] Error creating tables: {str(e)}")
        return False


def verify_database():
    """Verify all tables are created"""
    try:
        print("\n[10/9] Verifying database setup...")
        engine = create_engine(DATABASE_URL, poolclass=NullPool)

        expected_tables = [
            "seamen",
            "mutations",
            "locked_rotation_schedules",
            "sync_logs",
            "vessels",
            "vessels_groups",
            "vessels_ships",
            "rotation_submissions",
        ]

        with engine.connect() as conn:
            result = conn.execute(
                text(
                    """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """
                )
            )

            existing_tables = [row[0] for row in result.fetchall()]

            print("\nExisting tables:")
            for table in existing_tables:
                status = "[SUCCES]" if table in expected_tables else "?"
                print(f"  {status} {table}")

            missing_tables = set(expected_tables) - set(existing_tables)
            if missing_tables:
                print(f"\n[FAILED] Missing tables: {', '.join(missing_tables)}")
                return False

            # Check view
            result = conn.execute(
                text(
                    """
                SELECT table_name 
                FROM information_schema.views 
                WHERE table_schema = 'public'
            """
                )
            )
            views = [row[0] for row in result.fetchall()]

            if "v_latest_sync" in views:
                print("\nViews:")
                print("  [SUCCES] v_latest_sync")

        engine.dispose()
        print("\n[SUCCES] Database verification complete!")
        return True

    except Exception as e:
        print(f"\n[FAILED] Error verifying database: {str(e)}")
        return False


def init_database():
    """Main initialization function"""
    print("\nStarting database initialization...\n")

    # Step 1: Create database
    if not create_database():
        print("\n[FAILED] Database initialization failed!")
        return False

    # Step 2: Create tables
    if not create_tables():
        print("\n[FAILED] Database initialization failed!")
        return False

    # Step 3: Verify
    if not verify_database():
        print("\n[FAILED] Database initialization failed!")
        return False

    print("\n" + "=" * 60)
    print("[SUCCES] DATABASE INITIALIZATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)

    return True


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    import sys

    if "--drop" in sys.argv:
        # Drop database
        confirm = input(
            f"Are you sure you want to DROP database '{DB_NAME}'? (yes/no): "
        )
        if confirm.lower() == "yes":
            try:
                engine = create_engine(
                    POSTGRES_URL, poolclass=NullPool, isolation_level="AUTOCOMMIT"
                )
                with engine.connect() as conn:
                    # Terminate all connections first
                    conn.execute(
                        text(
                            f"""
                        SELECT pg_terminate_backend(pid)
                        FROM pg_stat_activity
                        WHERE datname = '{DB_NAME}'
                        AND pid <> pg_backend_pid()
                    """
                        )
                    )
                    conn.execute(text(f'DROP DATABASE IF EXISTS "{DB_NAME}"'))
                    print(f"[SUCCES] Database '{DB_NAME}' dropped successfully")
                engine.dispose()
            except Exception as e:
                print(f"[FAILED] Error dropping database: {str(e)}")
        else:
            print("Operation cancelled")
    else:
        # Normal initialization
        init_database()
