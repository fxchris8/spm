"""
Module seeder_new_grouping.py
Mengisi data awal grup kapal (vessels, vessels_groups, vessels_ships)
berdasarkan master data ship_particular dan susunan grup resmi (screenshot grouping).
Semua nama kapal menggunakan plain names (tanpa prefix KM., TB., BC., dll).
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import connection
from services.auth_service import register_user


def seed_users():
    """
    Seed initial users for authentication.
    """
    print("\n" + "=" * 70)
    print("SEEDING USERS")
    print("=" * 70 + "\n")

    users = [
        {
            "username": "admin",
            "email": "admin@spil.co.id",
            "password": "adminSPIL",
            "role": "ADMIN",
        },
        {
            "username": "crewing",
            "email": "crewing@spil.co.id",
            "password": "crewingSPIL",
            "role": "CREWING",
        },
        {
            "username": "user",
            "email": "user@spil.co.id",
            "password": "userSPIL",
            "role": "USER",
        },
    ]

    for u in users:
        try:
            result = register_user(u["username"], u["email"], u["password"], u["role"])
            if "error" in result:
                print(f"  [FAILED]  [{u['role']}] {u['username']}: {result['error']}")
            else:
                print(
                    f"  [SUCCESS] [{u['role']}] {u['username']} | password: {u['password']}"
                )
        except Exception as e:
            print(f"  [ERROR]   [{u['role']}] {u['username']}: {e}")


def seed_container_senior_data():
    """
    Seed data untuk Container Senior (Nakhoda, Mualim I, KKM, Masinis II)
    Berdasarkan screenshot: container_nakhoda.jpeg (8 groups) & container_kkm.jpeg (7 groups).
    """
    print("\n" + "=" * 70)
    print("SEEDING CONTAINER SENIOR DATA (Plain Names)")
    print("=" * 70 + "\n")

    # 8 Groups for Deck (Nakhoda & Mualim I)
    container_deck_groups = {
        "container_rotation1": [
            "ORIENTAL EMERALD",
            "ORIENTAL RUBY",
            "ORIENTAL SILVER",
            "ORIENTAL GOLD",
            "ORIENTAL JADE",
            "ORIENTAL DIAMOND",
            "ORIENTAL GALAXY",
            "VERIZON",
            "LUZON",
        ],
        "container_rotation2": [
            "HIJAU SAMUDRA",
            "HIJAU SEJUK",
            "HIJAU SEGAR",
            "HIJAU JELITA",
            "SPIL HANA",
            "SPIL HASYA",
            "SPIL HAYU",
            "SPIL HAPSRI",
            "ARMADA PERMATA",
        ],
        "container_rotation3": [
            "ORIENTAL SAMUDRA",
            "ORIENTAL PACIFIC",
            "PULAU NUNUKAN",
            "TELUK BERAU",
            "TELUK BINTUNI",
            "PULAU LAYANG",
            "PULAU WETAR",
            "PULAU HOKI",
            "PGL 01",
        ],
        "container_rotation4": [
            "ARMADA SERASI",
            "ARMADA SENADA",
            "ARMADA SEGARA",
            "TITANIUM",
            "VERTIKAL",
            "PEKAN BINTANG",
            "NELLY A100",
            "PEKAN TIMUR",
            "TELUK FLAMINGGO",
        ],
        "container_rotation5": [
            "SPIL RENATA",
            "SPIL RATNA",
            "SPIL RUMI",
            "SPIL RETNO",
            "SELILI BARU",
            "SPIL RAHAYU",
            "PEKAN TIRTA",
        ],
        "container_rotation6": [
            "PEKAN RIAU",
            "PEKAN BERAU",
            "PEKAN FAJAR",
            "PRATIWI SATU",
            "PEKAN SAMPIT",
            "MINAS BARU",
        ],
        "container_rotation7": [
            "BALI AYU",
            "BALI SANUR",
            "BALI KUTA",
            "BALI GIANYAR",
            "AKASHIA",
            "KAPPA",
            "MULI ANIM",
        ],
        "container_rotation8": [
            "PAHALA",
            "MAGELLAN",
            "FORTUNE",
            "PRATIWI RAYA",
            "THETA",
            "DERAJAT",
            "KSM XPLORER 135",
        ],
    }

    # 7 Groups for Engine (KKM & Masinis II)
    container_engine_groups = {
        "container_rotation1": [
            "ORIENTAL EMERALD",
            "ORIENTAL GALAXY",
            "ORIENTAL RUBY",
            "ORIENTAL SILVER",
            "ORIENTAL JADE",
            "ORIENTAL DIAMOND",
            "ARMADA PERMATA",
            "VERIZON",
            "LUZON",
        ],
        "container_rotation2": [
            "SPIL HAPSRI",
            "SPIL HASYA",
            "SPIL HAYU",
            "SPIL HANA",
            "HIJAU SAMUDRA",
            "ORIENTAL GOLD",
            "PGL 01",
            "HIJAU SEJUK",
            "HIJAU JELITA",
        ],
        "container_rotation3": [
            "ORIENTAL PACIFIC",
            "ORIENTAL SAMUDRA",
            "ARMADA SEGARA",
            "ARMADA SENADA",
            "ARMADA SERASI",
            "PULAU NUNUKAN",
            "TITANIUM",
            "VERTIKAL",
            "HIJAU SEGAR",
        ],
        "container_rotation4": [
            "PULAU HOKI",
            "TELUK BINTUNI",
            "TELUK FLAMINGGO",
            "PULAU LAYANG",
            "TELUK BERAU",
            "PULAU WETAR",
            "PEKAN BINTANG",
            "NELLY A100",
            "PEKAN TIRTA",
        ],
        "container_rotation5": [
            "MINAS BARU",
            "SELILI BARU",
            "PEKAN RIAU",
            "PEKAN FAJAR",
            "SPIL RETNO",
            "SPIL RAHAYU",
            "SPIL RATNA",
            "SPIL RUMI",
            "SPIL RENATA",
        ],
        "container_rotation6": [
            "PRATIWI RAYA",
            "PRATIWI SATU",
            "BALI AYU",
            "BALI GIANYAR",
            "BALI SANUR",
            "BALI KUTA",
            "MAGELLAN",
            "PAHALA",
            "FORTUNE",
        ],
        "container_rotation7": [
            "AKASHIA",
            "DERAJAT",
            "KAPPA",
            "PEKAN SAMPIT",
            "PEKAN BERAU",
            "THETA",
            "MULI ANIM",
            "PEKAN TIMUR",
            "KSM XPLORER 135",
        ],
    }

    nakhoda_data = {
        "job_title": "nakhoda",
        "vessel": "D",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "deck",
        "groups": container_deck_groups,
    }

    mualimI_data = {
        "job_title": "mualimI",
        "vessel": "D",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "deck",
        "groups": container_deck_groups,
    }

    kkm_data = {
        "job_title": "KKM",
        "vessel": "E",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "engine",
        "groups": container_engine_groups,
    }

    masinisII_data = {
        "job_title": "masinisII",
        "vessel": "E",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "engine",
        "groups": container_engine_groups,
    }

    configs = [nakhoda_data, mualimI_data, kkm_data, masinisII_data]
    for cfg in configs:
        try:
            res = connection.create_rotation_vessel(**cfg)
            print(f"  [SUCCESS] {res['message']} ({cfg['categorization']} - {cfg['job_title']})")
        except Exception as e:
            print(f"  [FAILED]  Failed to create {cfg['job_title']}: {str(e)}")


def seed_container_junior_data():
    """
    Seed data untuk Container Junior (Mualim II, Mualim III, Masinis III, Masinis IV)
    4 Groups untuk deck & engine.
    """
    print("\n" + "=" * 70)
    print("SEEDING CONTAINER JUNIOR DATA (Plain Names)")
    print("=" * 70 + "\n")

    container_junior_deck_groups = {
        "container_rotation1": [
            "ORIENTAL EMERALD",
            "ORIENTAL RUBY",
            "ORIENTAL SILVER",
            "ORIENTAL GOLD",
            "ORIENTAL JADE",
            "ORIENTAL DIAMOND",
            "LUZON",
            "VERIZON",
            "ORIENTAL GALAXY",
            "HIJAU SAMUDRA",
            "ARMADA PERMATA",
        ],
        "container_rotation2": [
            "ORIENTAL SAMUDRA",
            "ORIENTAL PACIFIC",
            "PULAU NUNUKAN",
            "TELUK FLAMINGGO",
            "TELUK BERAU",
            "TELUK BINTUNI",
            "PULAU LAYANG",
            "PULAU WETAR",
            "PULAU HOKI",
            "SPIL HANA",
            "SPIL HASYA",
            "SPIL HAPSRI",
            "SPIL HAYU",
        ],
        "container_rotation3": [
            "HIJAU JELITA",
            "HIJAU SEJUK",
            "ARMADA SEJATI",
            "ARMADA SERASI",
            "ARMADA SEGARA",
            "ARMADA SENADA",
            "HIJAU SEGAR",
            "TITANIUM",
            "VERTIKAL",
            "SPIL RENATA",
            "SPIL RATNA",
            "SPIL RUMI",
            "PEKAN BERAU",
            "SPIL RAHAYU",
            "SPIL RETNO",
            "MINAS BARU",
            "PEKAN SAMPIT",
            "SELILI BARU",
        ],
        "container_rotation4": [
            "DERAJAT",
            "MULI ANIM",
            "PRATIWI RAYA",
            "MAGELLAN",
            "PAHALA",
            "PEKAN RIAU",
            "PEKAN FAJAR",
            "FORTUNE",
            "PRATIWI SATU",
            "BALI SANUR",
            "BALI KUTA",
            "BALI GIANYAR",
            "BALI AYU",
            "AKASHIA",
            "KAPPA",
        ],
    }

    container_junior_engine_groups = {
        "container_rotation1": [
            "ORIENTAL GOLD",
            "ORIENTAL EMERALD",
            "ORIENTAL GALAXY",
            "ORIENTAL RUBY",
            "ORIENTAL SILVER",
            "ORIENTAL JADE",
            "VERIZON",
            "LUZON",
            "ORIENTAL DIAMOND",
        ],
        "container_rotation2": [
            "SPIL HAPSRI",
            "ARMADA PERMATA",
            "HIJAU SAMUDRA",
            "SPIL HASYA",
            "ARMADA SEJATI",
            "SPIL HAYU",
            "SPIL HANA",
            "HIJAU SEJUK",
            "HIJAU JELITA",
            "ORIENTAL PACIFIC",
            "ORIENTAL SAMUDRA",
            "ARMADA SEGARA",
            "ARMADA SENADA",
            "ARMADA SERASI",
            "SPIL RATNA",
            "SPIL RUMI",
            "PULAU NUNUKAN",
        ],
        "container_rotation3": [
            "PULAU HOKI",
            "TELUK BINTUNI",
            "TELUK FLAMINGGO",
            "PULAU LAYANG",
            "TELUK BERAU",
            "SPIL RENATA",
            "PULAU WETAR",
            "SPIL RAHAYU",
            "SPIL RETNO",
            "MINAS BARU",
            "SELILI BARU",
            "VERTIKAL",
            "HIJAU SEGAR",
            "PEKAN RIAU",
            "PEKAN BERAU",
            "PEKAN FAJAR",
            "PEKAN SAMPIT",
            "TITANIUM",
        ],
        "container_rotation4": [
            "PRATIWI RAYA",
            "PRATIWI SATU",
            "BALI AYU",
            "BALI GIANYAR",
            "BALI SANUR",
            "BALI KUTA",
            "MAGELLAN",
            "MULI ANIM",
            "PAHALA",
            "FORTUNE",
            "AKASHIA",
            "DERAJAT",
        ],
    }

    mualimII_data = {
        "job_title": "mualimII",
        "vessel": "D",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "deck",
        "groups": container_junior_deck_groups,
    }

    mualimIII_data = {
        "job_title": "mualimIII",
        "vessel": "D",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "deck",
        "groups": container_junior_deck_groups,
    }

    masinisIII_data = {
        "job_title": "masinisIII",
        "vessel": "E",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "engine",
        "groups": container_junior_engine_groups,
    }

    masinisIV_data = {
        "job_title": "masinisIV",
        "vessel": "E",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "engine",
        "groups": container_junior_engine_groups,
    }

    configs = [mualimII_data, mualimIII_data, masinisIII_data, masinisIV_data]
    for cfg in configs:
        try:
            res = connection.create_rotation_vessel(**cfg)
            print(f"  [SUCCESS] {res['message']} ({cfg['categorization']} - {cfg['job_title']})")
        except Exception as e:
            print(f"  [FAILED]  Failed to create {cfg['job_title']}: {str(e)}")


def seed_manalagi_senior_data():
    """
    Seed data untuk Manalagi Senior (Nakhoda, Mualim I, KKM, Masinis II)
    Berdasarkan screenshot: manalagi_nakhoda.jpeg & manalagi_kkm.jpeg (2 groups).
    """
    print("\n" + "=" * 70)
    print("SEEDING MANALAGI SENIOR DATA (Plain Names)")
    print("=" * 70 + "\n")

    manalagi_deck_groups = {
        "manalagi_rotation1": [
            "MANALAGI PRITA",
            "MANALAGI ASTA",
            "MANALAGI ASTI",
            "MANALAGI DASA",
            "MANALAGI ENZI",
            "XYS SATU",
        ],
        "manalagi_rotation2": [
            "MANALAGI TISYA",
            "MANALAGI SAMBA",
            "MANALAGI HITA",
            "MANALAGI VIRA",
            "MANALAGI YASA",
            "MANALAGI TARA",
            "MANALAGI WANDA",
        ],
    }

    manalagi_engine_groups = {
        "manalagi_rotation1": [
            "MANALAGI ASTA",
            "MANALAGI ASTI",
            "MANALAGI SAMBA",
            "MANALAGI YASA",
            "XYS SATU",
            "MANALAGI WANDA",
        ],
        "manalagi_rotation2": [
            "MANALAGI TISYA",
            "MANALAGI PRITA",
            "MANALAGI DASA",
            "MANALAGI HITA",
            "MANALAGI ENZI",
            "MANALAGI TARA",
            "MANALAGI VIRA",
        ],
    }

    nakhoda_data = {
        "job_title": "nakhoda",
        "vessel": "F",
        "rotation_type": "senior",
        "categorization": "manalagi",
        "part": "deck",
        "groups": manalagi_deck_groups,
    }

    mualimI_data = {
        "job_title": "mualimI",
        "vessel": "F",
        "rotation_type": "senior",
        "categorization": "manalagi",
        "part": "deck",
        "groups": manalagi_deck_groups,
    }

    kkm_data = {
        "job_title": "KKM",
        "vessel": "G",
        "rotation_type": "senior",
        "categorization": "manalagi",
        "part": "engine",
        "groups": manalagi_engine_groups,
    }

    masinisII_data = {
        "job_title": "masinisII",
        "vessel": "G",
        "rotation_type": "senior",
        "categorization": "manalagi",
        "part": "engine",
        "groups": manalagi_engine_groups,
    }

    configs = [nakhoda_data, mualimI_data, kkm_data, masinisII_data]
    for cfg in configs:
        try:
            res = connection.create_rotation_vessel(**cfg)
            print(f"  [SUCCESS] {res['message']} ({cfg['categorization']} - {cfg['job_title']})")
        except Exception as e:
            print(f"  [FAILED]  Failed to create {cfg['job_title']}: {str(e)}")


def seed_bc_senior_data():
    """
    Seed data untuk BC, TB, TK, Service Senior (Nakhoda, KKM)
    Berdasarkan screenshot: bc_nakhoda.jpeg & bc_kkm.jpeg (3 groups).
    """
    print("\n" + "=" * 70)
    print("SEEDING BC, TB, TK, SERVICE SENIOR DATA (Plain Names)")
    print("=" * 70 + "\n")

    bc_deck_groups = {
        "bc_rotation1": [
            "ANGSA LAUT",
            "BALIKPAPAN RAYA",
            "BANJARMASIN RAYA",
            "BAYA",
            "EPSILON",
            "GAJAH LAUT",
            "TOYO",
        ],
        "bc_rotation2": [
            "KAIMANA INDAH",
            "SAMARINDA RAYA",
            "SURABAYA RAYA",
            "TARAKAN RAYA",
            "BELAWAN RAYA",
            "YITNA YUWANA",
        ],
        "bc_rotation3": [
            "GAJAH MADA",
            "SHORYU BARU",
            "MURO 5",
            "TENYO",
            "MANGGA RAYA",
            "GAMMA SATU",
            "ALPHA",
        ],
    }

    bc_engine_groups = {
        "bc_rotation1": [
            "ANGSA LAUT",
            "BALIKPAPAN RAYA",
            "BANJARMASIN RAYA",
            "BELAWAN RAYA",
            "EPSILON",
            "GAMMA SATU",
            "ALPHA",
        ],
        "bc_rotation2": [
            "KAIMANA INDAH",
            "MURO 5",
            "SAMARINDA RAYA",
            "SHORYU BARU",
            "SURABAYA RAYA",
            "TARAKAN RAYA",
            "TENYO",
        ],
        "bc_rotation3": [
            "MANGGA RAYA",
            "TOYO",
            "YITNA YUWANA",
            "GAJAH MADA",
            "GAJAH LAUT",
            "BAYA",
        ],
    }

    nakhoda_data = {
        "job_title": "nakhoda",
        "vessel": "F",
        "rotation_type": "senior",
        "categorization": "bc",
        "part": "deck",
        "groups": bc_deck_groups,
    }

    kkm_data = {
        "job_title": "KKM",
        "vessel": "G",
        "rotation_type": "senior",
        "categorization": "bc",
        "part": "engine",
        "groups": bc_engine_groups,
    }

    configs = [nakhoda_data, kkm_data]
    for cfg in configs:
        try:
            res = connection.create_rotation_vessel(**cfg)
            print(f"  [SUCCESS] {res['message']} ({cfg['categorization']} - {cfg['job_title']})")
        except Exception as e:
            print(f"  [FAILED]  Failed to create {cfg['job_title']}: {str(e)}")


def clear_rotation_data():
    """Clear all rotation vessel data (untuk fresh seed)"""
    print("\n" + "=" * 70)
    print("CLEARING EXISTING ROTATION DATA (vessels, groups, ships)")
    print("=" * 70 + "\n")

    try:
        from sqlalchemy import text

        with connection.engine.connect() as conn:
            conn.execute(text("DELETE FROM vessels_ships"))
            conn.execute(text("DELETE FROM vessels_groups"))
            conn.execute(text("DELETE FROM vessels"))
            conn.commit()
            print("  [SUCCESS] All rotation vessel data cleared successfully")
    except Exception as e:
        print(f"  [FAILED] Failed to clear rotation data: {str(e)}")
        raise e


if __name__ == "__main__":
    SEEDERS = {
        "users": seed_users,
        "container_senior": seed_container_senior_data,
        "container_junior": seed_container_junior_data,
        "manalagi": seed_manalagi_senior_data,
        "bc": seed_bc_senior_data,
    }

    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    print("\n" + "=" * 50)
    print("NEW ROTATION GROUPING SEEDER (ship_particular based)")
    print("=" * 50)

    if "--fresh" in sys.argv:
        print("\n[WARNING] FRESH SEED MODE: Clearing existing rotation configs first...")
        clear_rotation_data()

    if args:
        invalid = [a for a in args if a not in SEEDERS]
        if invalid:
            print(f"\n[ERROR] Unknown seeder(s): {', '.join(invalid)}")
            print(f"Available: {', '.join(SEEDERS.keys())}")
            sys.exit(1)
        selected = args
    else:
        selected = list(SEEDERS.keys())

    try:
        for name in selected:
            SEEDERS[name]()
        print("\n" + "=" * 50)
        print("SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 50 + "\n")
    except Exception as e:
        print(f"\n[FAILED] SEEDING ERROR: {str(e)}\n")
        sys.exit(1)
