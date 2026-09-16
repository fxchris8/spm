"""
Module ini menangani konfigurasi role (Senior vs Junior) untuk posisi perwira
seperti Mualim I dan Masinis II per kategori armada (container, manalagi, bc).
Menjadi satu-satunya sumber kebenaran (authoritative source of truth) untuk klasifikasi role.
"""

from sqlalchemy import text
from database.database import get_db_connection

# Default standar SPIL: 4 Senior (Nakhoda, KKM, Mualim I, Masinis II) & 4 Junior
DEFAULT_ROLE_SETTINGS = {
    "container": {
        "nakhoda": "senior",
        "KKM": "senior",
        "mualimI": "senior",
        "masinisII": "senior",
        "mualimII": "junior",
        "mualimIII": "junior",
        "masinisIII": "junior",
        "masinisIV": "junior",
    },
    "manalagi": {
        "nakhoda": "senior",
        "KKM": "senior",
        "mualimI": "senior",
        "masinisII": "senior",
        "mualimII": "junior",
        "mualimIII": "junior",
        "masinisIII": "junior",
        "masinisIV": "junior",
    },
    "bc": {
        "nakhoda": "senior",
        "KKM": "senior",
        "mualimI": "senior",
        "masinisII": "senior",
        "mualimII": "junior",
        "mualimIII": "junior",
        "masinisIII": "junior",
        "masinisIV": "junior",
    },
}

VALID_CATEGORIES = {"container", "manalagi", "bc"}
VALID_POSITIONS = {
    "nakhoda",
    "KKM",
    "mualimI",
    "masinisII",
    "mualimII",
    "mualimIII",
    "masinisIII",
    "masinisIV",
}
CANONICAL_POSITION_MAP = {p.lower(): p for p in VALID_POSITIONS}

_table_ensured = False


class RoleIntegrityError(Exception):
    """Raised when role settings data is missing, corrupted, or violates authoritative invariants."""
    pass


def ensure_role_settings_table(conn=None):
    """
    Pastikan tabel role_settings sudah ada dan terisi 24 default rows secara idempoten.
    Dipanggil saat startup / sebelum query pertama dijalankan.
    Jika conn diberikan, eksekusi DDL & seed rows tanpa commit (caller owns the transaction).
    Jika conn tidak diberikan, eksekusi dengan dedicated connection dan COMMIT.
    """
    global _table_ensured
    if _table_ensured and conn is None:
        return

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS role_settings (
        id BIGSERIAL PRIMARY KEY,
        categorization VARCHAR(50) NOT NULL,
        position VARCHAR(50) NOT NULL,
        role_type VARCHAR(20) NOT NULL DEFAULT 'junior',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(categorization, position)
    );
    CREATE INDEX IF NOT EXISTS idx_role_settings_cat_pos ON role_settings(categorization, position);
    """

    seed_rows = []
    for cat, pos_map in DEFAULT_ROLE_SETTINGS.items():
        for pos, role_type in pos_map.items():
            seed_rows.append({"cat": cat, "pos": pos, "role": role_type})

    insert_defaults_sql = """
    INSERT INTO role_settings (categorization, position, role_type)
    VALUES (:cat, :pos, :role)
    ON CONFLICT (categorization, position) DO NOTHING;
    """

    def _execute(target_conn):
        target_conn.execute(text(create_table_sql))
        for row in seed_rows:
            target_conn.execute(text(insert_defaults_sql), row)

    if conn is not None:
        _execute(conn)
    else:
        with get_db_connection() as new_conn:
            _execute(new_conn)
            new_conn.commit()
        _table_ensured = True


def get_position_classification(
    categorization: str, position: str, conn=None, for_update: bool = False
) -> str:
    """
    Ambil klasifikasi role ('senior' atau 'junior') untuk posisi dan kategori tertentu.
    Jika tidak valid atau terjadi error DB, raise exception (fail-closed).
    Tidak boleh fallback ke in-memory defaults jika baris database tidak ditemukan.
    Jika for_update=True, kunci baris database menggunakan SELECT ... FOR UPDATE.
    """
    if not categorization or not position:
        raise ValueError("categorization and position are required")

    cat = categorization.lower().strip()
    norm_pos = CANONICAL_POSITION_MAP.get(position.strip().lower())
    if not norm_pos:
        raise ValueError(f"Invalid position '{position}'. Must be one of {list(VALID_POSITIONS)}")
    if cat not in VALID_CATEGORIES:
        raise ValueError(f"Invalid categorization '{categorization}'. Must be one of {list(VALID_CATEGORIES)}")

    def _query(c):
        query = """
            SELECT role_type
            FROM role_settings
            WHERE LOWER(categorization) = :cat AND position = :pos
        """
        if for_update:
            query += " FOR UPDATE"

        row = c.execute(text(query), {"cat": cat, "pos": norm_pos}).fetchone()
        if not row or not row[0]:
            raise RoleIntegrityError(
                f"Authoritative role classification missing in database for category '{cat}', position '{norm_pos}'."
            )
        role_type = row[0].lower().strip()
        if role_type not in ("senior", "junior"):
            raise RoleIntegrityError(
                f"Invalid role_type '{role_type}' in database for category '{cat}', position '{norm_pos}'."
            )
        return role_type

    if conn is not None:
        return _query(conn)
    else:
        with get_db_connection() as c:
            return _query(c)


def get_all_role_settings(conn=None) -> dict:
    """
    Ambil semua pengaturan role per kategori kapal.
    Harus memuat semua 3 kategori dan semua 8 posisi per kategori.
    Setiap posisi harus memiliki role_type valid ('senior' atau 'junior').
    Setiap kategori harus memiliki minimal 1 Senior dan 1 Junior.
    Jika DB error atau integritas data rusak, raise RoleIntegrityError.
    """
    def _fetch(c):
        query = """
            SELECT categorization, position, role_type
            FROM role_settings
        """
        rows = c.execute(text(query)).fetchall()

        result = {cat: {} for cat in VALID_CATEGORIES}

        for row in rows:
            cat = row[0].lower().strip()
            pos = row[1]
            role_type = row[2].lower().strip()
            canonical_pos = CANONICAL_POSITION_MAP.get(pos.lower(), pos)
            if cat in result and canonical_pos in VALID_POSITIONS:
                if role_type not in ("senior", "junior"):
                    raise RoleIntegrityError(
                        f"Corrupted role_settings: invalid role_type '{role_type}' in category '{cat}', position '{canonical_pos}'."
                    )
                result[cat][canonical_pos] = role_type

        # Verify completeness and invariants:
        # Each category must have all 8 positions, at least 1 Senior and at least 1 Junior
        for cat in VALID_CATEGORIES:
            missing = VALID_POSITIONS - set(result[cat].keys())
            if missing:
                raise RoleIntegrityError(
                    f"Corrupted role_settings: category '{cat}' is missing positions: {missing}"
                )
            senior_count = sum(1 for r in result[cat].values() if r == "senior")
            junior_count = sum(1 for r in result[cat].values() if r == "junior")
            if senior_count < 1:
                raise RoleIntegrityError(
                    f"Corrupted role_settings: category '{cat}' has no Senior positions."
                )
            if junior_count < 1:
                raise RoleIntegrityError(
                    f"Corrupted role_settings: category '{cat}' has no Junior positions."
                )

        return result

    if conn is not None:
        return _fetch(conn)
    else:
        with get_db_connection() as c:
            return _fetch(c)


def save_role_setting(categorization: str, position: str, role_type: str) -> dict:
    """
    Simpan atau update konfigurasi role untuk posisi dan kategori tertentu.
    Menggunakan transactional row lock (SELECT ... FOR UPDATE) untuk mencegah race condition
    dan memvalidasi invariant minimal 1 posisi Senior dan 1 posisi Junior.
    Juga menyinkronkan kolom 'type' pada tabel vessels dalam transaksi yang sama.
    """
    if not categorization or not position or not role_type:
        raise ValueError("categorization, position, and role_type are required")

    cat = categorization.lower().strip()
    role = role_type.lower().strip()

    if cat not in VALID_CATEGORIES:
        raise ValueError(f"Invalid categorization '{categorization}'. Must be one of {list(VALID_CATEGORIES)}")

    norm_pos = CANONICAL_POSITION_MAP.get(position.strip().lower())
    if not norm_pos:
        raise ValueError(f"Invalid position '{position}'. Must be one of {list(VALID_POSITIONS)}")

    if role not in ("senior", "junior"):
        raise ValueError(f"Invalid role_type '{role_type}'. Must be 'senior' or 'junior'.")

    try:
        with get_db_connection() as conn:
            try:
                # 1. Lock all rows for this category to calculate invariant safely
                lock_query = """
                    SELECT position, role_type
                    FROM role_settings
                    WHERE LOWER(categorization) = :cat
                    FOR UPDATE
                """
                locked_rows = conn.execute(text(lock_query), {"cat": cat}).fetchall()
                if len(locked_rows) != len(VALID_POSITIONS):
                    raise RoleIntegrityError(
                        f"Cannot save role setting: category '{cat}' is missing positions in database."
                    )
                current_roles = {r[0]: r[1].lower() for r in locked_rows}

                # Calculate projected counts
                current_roles[norm_pos] = role
                senior_count = sum(1 for r in current_roles.values() if r == "senior")
                junior_count = sum(1 for r in current_roles.values() if r == "junior")

                if senior_count < 1:
                    raise ValueError("Rotasi Senior minimal harus memiliki 1 posisi perwira.")
                if junior_count < 1:
                    raise ValueError("Rotasi Junior minimal harus memiliki 1 posisi perwira.")

                # 2. Upsert into role_settings
                upsert_query = """
                    INSERT INTO role_settings (categorization, position, role_type, updated_at)
                    VALUES (:cat, :pos, :role, NOW())
                    ON CONFLICT (categorization, position)
                    DO UPDATE SET role_type = :role, updated_at = NOW()
                """
                conn.execute(
                    text(upsert_query),
                    {"cat": cat, "pos": norm_pos, "role": role},
                )

                # 3. Sync vessels table in the same transaction
                sync_vessels_query = """
                    UPDATE vessels
                    SET type = :role, updated_at = NOW()
                    WHERE LOWER(categorization) = :cat
                      AND job_title = :pos
                """
                conn.execute(
                    text(sync_vessels_query),
                    {"cat": cat, "pos": norm_pos, "role": role},
                )

                # 4. Fetch updated settings within the same transaction before commit
                updated_settings = get_all_role_settings(conn)

                conn.commit()
                return updated_settings
            except Exception as e:
                conn.rollback()
                raise e

    except Exception as e:
        print(f"ERROR - Failed to save role_setting: {e}")
        raise e


def reset_role_settings(categorization: str = None) -> dict:
    """
    Reset role_settings ke default 4/4 untuk kategori tertentu atau semua kategori.
    Mengupdate baris role_settings ke default canonical dan menyinkronkan kolom 'type' di vessels.
    """
    cat = categorization.lower().strip() if categorization else None
    if cat and cat not in VALID_CATEGORIES:
        raise ValueError(f"Invalid categorization '{categorization}'. Must be one of {list(VALID_CATEGORIES)}")

    target_cats = [cat] if cat else list(VALID_CATEGORIES)

    try:
        with get_db_connection() as conn:
            try:
                for target_cat in target_cats:
                    # Lock rows
                    lock_query = """
                        SELECT position, role_type
                        FROM role_settings
                        WHERE LOWER(categorization) = :cat
                        FOR UPDATE
                    """
                    locked_rows = conn.execute(text(lock_query), {"cat": target_cat}).fetchall()
                    if len(locked_rows) != len(VALID_POSITIONS):
                        raise RoleIntegrityError(
                            f"Cannot reset role settings: category '{target_cat}' is missing positions in database."
                        )

                    default_map = DEFAULT_ROLE_SETTINGS[target_cat]
                    for pos, default_role in default_map.items():
                        # Update role_settings
                        conn.execute(
                            text(
                                """
                                UPDATE role_settings
                                SET role_type = :role, updated_at = NOW()
                                WHERE LOWER(categorization) = :cat AND position = :pos
                                """
                            ),
                            {"cat": target_cat, "pos": pos, "role": default_role},
                        )

                        # Sync vessels
                        conn.execute(
                            text(
                                """
                                UPDATE vessels
                                SET type = :role, updated_at = NOW()
                                WHERE LOWER(categorization) = :cat AND job_title = :pos
                                """
                            ),
                            {"cat": target_cat, "pos": pos, "role": default_role},
                        )

                # Fetch updated settings within the same transaction before commit
                updated_settings = get_all_role_settings(conn)

                conn.commit()
                return updated_settings
            except Exception as e:
                conn.rollback()
                raise e

    except Exception as e:
        print(f"ERROR - Failed to reset role_settings: {e}")
        raise e


def _reset_table_ensured_flag():
    """Helper for testing to allow re-testing ensure_role_settings_table logic."""
    global _table_ensured
    _table_ensured = False
