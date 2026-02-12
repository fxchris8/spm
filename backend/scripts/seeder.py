"""
@faw_sd
Seeder untuk tabel vessels, vessels_groups, dan vessels_ships
Script ini akan mengisi data awal untuk vessel management
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import connection


def seed_rotation_junior_data():
    """
    Seed data untuk rotation junior
    Type: junior
    Jobs: mualimII, mualimIII, masinisIII, masinisIV
    """

    print("\n" + "=" * 70)
    print("SEEDING ROTATION junior DATA (type: junior)")
    print("=" * 70 + "\n")

    # ============ MUALIM II ============
    mualimII_data = {
        "job_title": "mualimII",
        "vessel": "D",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "deck",
        "groups": {
            "container_rotation1": [
                "KM. ORIENTAL EMERALD",
                "KM. ORIENTAL RUBY",
                "KM. ORIENTAL SILVER",
                "KM. ORIENTAL GOLD",
                "KM. ORIENTAL JADE",
                "KM. ORIENTAL DIAMOND",
                "KM. LUZON",
                "KM. VERIZON",
                "KM. ORIENTAL GALAXY",
                "KM. HIJAU SAMUDRA",
                "KM. ARMADA PERMATA",
            ],
            "container_rotation2": [
                "KM. ORIENTAL SAMUDERA",
                "KM. ORIENTAL PACIFIC",
                "KM. PULAU NUNUKAN",
                "KM. TELUK FLAMINGGO",
                "KM. TELUK BERAU",
                "KM. TELUK BINTUNI",
                "KM. PULAU LAYANG",
                "KM. PULAU WETAR",
                "KM. PULAU HOKI",
                "KM. SPIL HANA",
                "KM. SPIL HASYA",
                "KM. SPIL HAPSRI",
                "KM. SPIL HAYU",
            ],
            "container_rotation3": [
                "KM. HIJAU JELITA",
                "KM. HIJAU SEJUK",
                "KM. ARMADA SEJATI",
                "KM. ARMADA SERASI",
                "KM. ARMADA SEGARA",
                "KM. ARMADA SENADA",
                "KM. HIJAU SEGAR",
                "KM. TITANIUM",
                "KM. VERTIKAL",
                "KM. SPIL RENATA",
                "KM. SPIL RATNA",
                "KM. SPIL RUMI",
                "KM. PEKAN BERAU",
                "KM SPIL RAHAYU",
                "KM. SPIL RETNO",
                "KM. MINAS BARU",
                "KM PEKAN SAMPIT",
                "KM. SELILI BARU",
            ],
            "container_rotation4": [
                "KM. DERAJAT",
                "KM. MULIANIM",
                "KM. PRATIWI RAYA",
                "KM. MAGELLAN",
                "KM. PAHALA",
                "KM. PEKAN RIAU",
                "KM. PEKAN FAJAR",
                "KM. FORTUNE",
                "KM. PRATIWI SATU",
                "KM. BALI SANUR",
                "KM. BALI KUTA",
                "KM. BALI GIANYAR",
                "KM. BALI AYU",
                "KM. AKASHIA",
                "KM KAPPA",
            ],
        },
    }

    # ============ MUALIM III ============
    mualimIII_data = {
        "job_title": "mualimIII",
        "vessel": "D",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "deck",
        "groups": mualimII_data["groups"],
    }

    # ============ MASINIS III ============
    masinisIII_data = {
        "job_title": "masinisIII",
        "vessel": "E",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "engine",
        "groups": {
            "container_rotation1": [
                "KM. ORIENTAL GOLD",
                "KM. ORIENTAL EMERALD",
                "KM. ORIENTAL GALAXY",
                "KM. ORIENTAL RUBY",
                "KM. ORIENTAL SILVER",
                "KM. ORIENTAL JADE",
                "KM. VERIZON",
                "KM. LUZON",
                "KM. ORIENTAL DIAMOND",
            ],
            "container_rotation2": [
                "KM. SPIL HAPSRI",
                "KM. ARMADA PERMATA",
                "KM. HIJAU SAMUDRA",
                "KM. SPIL HASYA",
                "KM. ARMADA SEJATI",
                "KM. SPIL HAYU",
                "KM. SPIL HANA",
                "KM. HIJAU SEJUK",
                "KM. HIJAU JELITA",
                "KM. ORIENTAL PACIFIC",
                "KM. ORIENTAL SAMUDERA",
                "KM. ARMADA SEGARA",
                "KM. ARMADA SENADA",
                "KM. ARMADA SERASI",
                "KM. SPIL RATNA",
                "KM. SPIL RUMI",
                "KM. PULAU NUNUKAN",
            ],
            "container_rotation3": [
                "KM. PULAU HOKI",
                "KM. TELUK BINTUNI",
                "KM. TELUK FLAMINGGO",
                "KM. PULAU LAYANG",
                "KM. TELUK BERAU",
                "KM. SPIL RENATA",
                "KM. PULAU WETAR",
                "KM SPIL RAHAYU",
                "KM. SPIL RETNO",
                "KM. MINAS BARU",
                "KM. SELILI BARU",
                "KM. VERTIKAL",
                "KM. HIJAU SEGAR",
                "KM. PEKAN RIAU",
                "KM. PEKAN BERAU",
                "KM. PEKAN FAJAR",
                "KM. PEKAN SAMPIT",
                "KM. TITANIUM",
            ],
            "container_rotation4": [
                "KM. PRATIWI RAYA",
                "KM. PRATIWI SATU",
                "KM. BALI AYU",
                "KM. BALI GIANYAR",
                "KM. BALI SANUR",
                "KM. BALI KUTA",
                "KM. MAGELLAN",
                "KM. MULIANIM",
                "KM. PAHALA",
                "KM. FORTUNE",
                "KM. AKASHIA",
                "KM. DERAJAT",
            ],
        },
    }

    # ============ MASINIS IV ============
    masinisIV_data = {
        "job_title": "masinisIV",
        "vessel": "E",
        "rotation_type": "junior",
        "categorization": "container",
        "part": "engine",
        "groups": masinisIII_data["groups"],
    }

    # Insert all junior configs
    configs = [mualimII_data, mualimIII_data, masinisIII_data, masinisIV_data]

    for config in configs:
        try:
            result = connection.create_rotation_vessel(**config)
            print(f"[SUCCES] {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"[FAILED] Failed to create {config['job_title']}: {str(e)}")


def seed_rotation_senior_data():
    """
    Seed data untuk rotation senior
    Type: senior
    Jobs: nakhoda, KKM, mualimI, masinisII
    """

    print("\n" + "=" * 70)
    print("SEEDING ROTATION senior DATA (type: senior)")
    print("=" * 70 + "\n")

    # ============ NAKHODA ============
    nakhoda_data = {
        "job_title": "nakhoda",
        "vessel": "D",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "deck",
        "groups": {
            "container_rotation1": [
                "KM. ORIENTAL EMERALD",
                "KM. ORIENTAL RUBY",
                "KM. ORIENTAL SILVER",
                "KM. ORIENTAL GOLD",
                "KM. ORIENTAL JADE",
                "KM. ORIENTAL DIAMOND",
            ],
            "container_rotation2": [
                "KM. LUZON",
                "KM. VERIZON",
                "KM. ORIENTAL GALAXY",
                "KM. HIJAU SAMUDRA",
                "KM. ARMADA PERMATA",
            ],
            "container_rotation3": [
                "KM. ORIENTAL SAMUDERA",
                "KM. ORIENTAL PACIFIC",
                "KM. PULAU NUNUKAN",
                "KM. TELUK FLAMINGGO",
                "KM. TELUK BERAU",
                "KM. TELUK BINTUNI",
            ],
            "container_rotation4": [
                "KM. PULAU LAYANG",
                "KM. PULAU WETAR",
                "KM. PULAU HOKI",
                "KM. SPIL HANA",
                "KM. SPIL HASYA",
                "KM. SPIL HAPSRI",
                "KM. SPIL HAYU",
            ],
            "container_rotation5": [
                "KM. HIJAU JELITA",
                "KM. HIJAU SEJUK",
                "KM. ARMADA SEJATI",
                "KM. ARMADA SERASI",
                "KM. ARMADA SEGARA",
                "KM. ARMADA SENADA",
                "KM. HIJAU SEGAR",
                "KM. TITANIUM",
                "KM. VERTIKAL",
            ],
            "container_rotation6": [
                "KM. SPIL RENATA",
                "KM. SPIL RATNA",
                "KM. SPIL RUMI",
                "KM. PEKAN BERAU",
                "KM SPIL RAHAYU",
                "KM. SPIL RETNO",
                "KM. MINAS BARU",
                "KM PEKAN SAMPIT",
                "KM. SELILI BARU",
            ],
            "container_rotation7": [
                "KM. DERAJAT",
                "KM. MULIANIM",
                "KM. PRATIWI RAYA",
                "KM. MAGELLAN",
                "KM. PAHALA",
                "KM. PEKAN RIAU",
                "KM. PEKAN FAJAR",
                "KM. FORTUNE",
            ],
            "container_rotation8": [
                "KM. PRATIWI SATU",
                "KM. BALI SANUR",
                "KM. BALI KUTA",
                "KM. BALI GIANYAR",
                "KM. BALI AYU",
                "KM. AKASHIA",
                "KM KAPPA",
            ],
        },
    }

    # ============ KKM ============
    kkm_data = {
        "job_title": "KKM",
        "vessel": "E",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "engine",
        "groups": {
            "container_rotation1": [
                "KM. ORIENTAL GOLD",
                "KM. ORIENTAL EMERALD",
                "KM. ORIENTAL GALAXY",
                "KM. ORIENTAL RUBY",
                "KM. ORIENTAL SILVER",
                "KM. ORIENTAL JADE",
                "KM. VERIZON",
                "KM. LUZON",
                "KM. ORIENTAL DIAMOND",
            ],
            "container_rotation2": [
                "KM. SPIL HAPSRI",
                "KM. ARMADA PERMATA",
                "KM. HIJAU SAMUDRA",
                "KM. SPIL HASYA",
                "KM. ARMADA SEJATI",
                "KM. SPIL HAYU",
                "KM. SPIL HANA",
                "KM. HIJAU SEJUK",
                "KM. HIJAU JELITA",
            ],
            "container_rotation3": [
                "KM. ORIENTAL PACIFIC",
                "KM. ORIENTAL SAMUDERA",
                "KM. ARMADA SEGARA",
                "KM. ARMADA SENADA",
                "KM. ARMADA SERASI",
                "KM. SPIL RATNA",
                "KM. SPIL RUMI",
                "KM. PULAU NUNUKAN",
            ],
            "container_rotation4": [
                "KM. PULAU HOKI",
                "KM. TELUK BINTUNI",
                "KM. TELUK FLAMINGGO",
                "KM. PULAU LAYANG",
                "KM. TELUK BERAU",
                "KM. SPIL RENATA",
                "KM. PULAU WETAR",
                "KM SPIL RAHAYU",
                "KM. SPIL RETNO",
            ],
            "container_rotation5": [
                "KM. MINAS BARU",
                "KM. SELILI BARU",
                "KM. VERTIKAL",
                "KM. HIJAU SEGAR",
                "KM. PEKAN RIAU",
                "KM. PEKAN BERAU",
                "KM. PEKAN FAJAR",
                "KM. PEKAN SAMPIT",
                "KM. TITANIUM",
            ],
            "container_rotation6": [
                "KM. PRATIWI RAYA",
                "KM. PRATIWI SATU",
                "KM. BALI AYU",
                "KM. BALI GIANYAR",
                "KM. BALI SANUR",
                "KM. BALI KUTA",
            ],
            "container_rotation7": [
                "KM. MAGELLAN",
                "KM. MULIANIM",
                "KM. PAHALA",
                "KM. FORTUNE",
                "KM. AKASHIA",
                "KM. DERAJAT",
            ],
        },
    }

    # ============ MUALIM I ============
    mualimI_data = {
        "job_title": "mualimI",
        "vessel": "D",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "deck",
        "groups": nakhoda_data["groups"],
    }

    # ============ MASINIS II ============
    masinisII_data = {
        "job_title": "masinisII",
        "vessel": "E",
        "rotation_type": "senior",
        "categorization": "container",
        "part": "engine",
        "groups": kkm_data["groups"],
    }

    # Insert all senior configs
    configs = [nakhoda_data, kkm_data, mualimI_data, masinisII_data]

    for config in configs:
        try:
            result = connection.create_rotation_vessel(**config)
            print(f"[SUCCESS] {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"[FAILED] Failed to create {config['job_title']}: {str(e)}")


def seed_rotation_manalagi_senior_data():
    """
    Seed data untuk rotation manalagi
    Type: senior
    Categorization: manalagi
    Jobs: nakhoda (vessel F), KKM (vessel G)
    """

    print("\n" + "=" * 70)
    print("SEEDING ROTATION MANALAGI DATA (type: senior, categorization: manalagi)")
    print("=" * 70 + "\n")

    # ============ NAKHODA (Manalagi) ============
    nakhoda_manalagi_data = {
        "job_title": "nakhoda",
        "vessel": "F",
        "rotation_type": "senior",
        "categorization": "manalagi",
        "part": "deck",
        "groups": {
            "manalagi_rotation1": [
                "KM. MANALAGI PRITA",
                "KM. MANALAGI ASTA",
                "KM. MANALAGI ASTI",
                "KM. MANALAGI DASA",
                "KM. MANALAGI ENZI",
                "KM. MANALAGI TARA",
                "KM. MANALAGI WANDA",
            ],
            "manalagi_rotation2": [
                "KM. MANALAGI TISYA",
                "KM. MANALAGI SAMBA",
                "KM. MANALAGI HITA",
                "KM. MANALAGI VIRA",
                "KM. MANALAGI YASA",
                "KM. XYS SATU",
            ],
        },
    }

    # ============ KKM (Manalagi) ============
    kkm_manalagi_data = {
        "job_title": "KKM",
        "vessel": "G",
        "rotation_type": "senior",
        "categorization": "manalagi",
        "part": "engine",
        "groups": {
            "manalagi_rotation1": [
                "KM. MANALAGI ASTA",
                "KM. MANALAGI ASTI",
                "KM. MANALAGI SAMBA",
                "KM. MANALAGI YASA",
                "KM. XYS SATU",
                "KM. MANALAGI WANDA",
            ],
            "manalagi_rotation2": [
                "KM. MANALAGI TISYA",
                "KM. MANALAGI PRITA",
                "KM. MANALAGI DASA",
                "KM. MANALAGI HITA",
                "KM. MANALAGI ENZI",
                "KM. MANALAGI TARA",
                "KM. MANALAGI VIRA",
            ],
        },
    }

    # Insert all manalagi configs
    configs = [nakhoda_manalagi_data, kkm_manalagi_data]

    for config in configs:
        try:
            result = connection.create_rotation_vessel(**config)
            print(f"[SUCCES] {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"[FAILED] Failed to create {config['job_title']}: {str(e)}")


def seed_rotation_barge_crane_senior_data():
    """
    Seed data untuk rotation barge crane
    Type: senior
    Categorization: bc
    Jobs: nakhoda (vessel F), KKM (vessel G)
    """

    print("\n" + "=" * 70)
    print("SEEDING ROTATION BARGE CRANE DATA (type: senior, categorization: bc)")
    print("=" * 70 + "\n")

    # ============ NAKHODA (Barge Crane) ============
    nakhoda_bc_data = {
        "job_title": "nakhoda",
        "vessel": "F",
        "rotation_type": "senior",
        "categorization": "bc",
        "part": "deck",
        "groups": {
            "bc_rotation1": [
                "BC. ANGSA LAUT",
                "BC. BALIKPAPAN RAYA",
                "BC. BANJARMASIN RAYA",
                "BC. BAYA",
                "BC. BELAWAN RAYA",
                "BC. EPSILON",
                "BC. GAJAH LAUT",
            ],
            "bc_rotation2": [
                "BC. GAJAH MADA",
                "BC. KAIMANA INDAH",
                "BC. MURO 5",
                "BC. SAMARINDA RAYA",
                "BC. SHORYU BARU",
                "BC. SURABAYA RAYA",
                "BC. TARAKAN RAYA",
                "BC. TENYO MARU",
            ],
        },
    }

    # ============ KKM (Barge Crane) ============
    kkm_bc_data = {
        "job_title": "KKM",
        "vessel": "G",
        "rotation_type": "senior",
        "categorization": "bc",
        "part": "engine",
        "groups": {
            "bc_rotation1": [
                "BC. ANGSA LAUT",
                "BC. BALIKPAPAN RAYA",
                "BC. BANJARMASIN RAYA",
                "BC. BAYA",
                "BC. BELAWAN RAYA",
                "BC. EPSILON",
                "BC. GAJAH LAUT",
            ],
            "bc_rotation2": [
                "BC. GAJAH MADA",
                "BC. KAIMANA INDAH",
                "BC. MURO 5",
                "BC. SAMARINDA RAYA",
                "BC. SHORYU BARU",
                "BC. SURABAYA RAYA",
                "BC. TARAKAN RAYA",
                "BC. TENYO MARU",
            ],
        },
    }

    # Insert all barge crane configs
    configs = [nakhoda_bc_data, kkm_bc_data]

    for config in configs:
        try:
            result = connection.create_rotation_vessel(**config)
            print(f"[SUCCES] {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"[FAILED] Failed to create {config['job_title']}: {str(e)}")


def clear_rotation_data():
    """Clear all rotation data (untuk fresh seed)"""
    print("\n" + "=" * 70)
    print("CLEARING EXISTING ROTATION DATA")
    print("=" * 70 + "\n")

    try:
        from sqlalchemy import text

        with connection.engine.connect() as conn:
            # CASCADE akan otomatis hapus vessels_groups dan vessels_ships
            conn.execute(text("DELETE FROM vessels"))
            conn.commit()
            print("[SUCCES] All rotation data cleared successfully")
    except Exception as e:
        print(f"[FAILED] Failed to clear rotation data: {str(e)}")
        raise e


if __name__ == "__main__":
    import sys

    print("\n" + "=" * 35)
    print("ROTATION DATA SEEDER")
    print("=" * 35)

    # Check for --fresh flag
    if "--fresh" in sys.argv:
        print("\n[WARNING] FRESH SEED MODE: Clearing existing data first...")
        confirm = input(
            "This will DELETE all existing rotation data. Continue? (yes/no): "
        )
        if confirm.lower() != "yes":
            print("\n[FAILED] Seeding cancelled by user")
            sys.exit(0)
        clear_rotation_data()

    # Run seeding
    try:
        seed_rotation_junior_data()
        seed_rotation_senior_data()
        seed_rotation_manalagi_senior_data()
        seed_rotation_barge_crane_senior_data()

    except Exception as e:
        print("\n" + "[FAILED]" * 35)
        print(f"SEEDING FAILED: {str(e)}")
        print("[FAILED]" * 35 + "\n")
        sys.exit(1)
