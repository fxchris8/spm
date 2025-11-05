# migrate_rotation_data.py
"""
Script untuk migrasi data hardcode rotation dari React components ke database
Jalankan: python migrate_rotation_data.py
"""

import database


def migrate_rotation_schedule_data():
    """
    Migrate data dari RotationSchedule.tsx
    Type: schedule (bukan container!)
    Jobs: mualimII, mualimIII, masinisIII, masinisIV
    """

    print("\n" + "=" * 70)
    print("MIGRATING ROTATION SCHEDULE DATA (type: schedule)")
    print("=" * 70 + "\n")

    # ============ MUALIM II ============
    mualimII_data = {
        "job_title": "mualimII",
        "vessel": "D",
        "rotation_type": "schedule",  # ✅ Ubah dari 'type' ke 'rotation_type'
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
        "rotation_type": "schedule",  # ✅ Ubah dari 'type' ke 'rotation_type'
        "part": "deck",
        "groups": mualimII_data["groups"],
    }

    # ============ MASINIS III ============
    masinisIII_data = {
        "job_title": "masinisIII",
        "vessel": "E",
        "rotation_type": "schedule",  # ✅ Ubah dari 'type' ke 'rotation_type'
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
        "rotation_type": "schedule",  # ✅ Ubah dari 'type' ke 'rotation_type'
        "part": "engine",
        "groups": masinisIII_data["groups"],
    }

    # Insert all schedule configs
    configs = [mualimII_data, mualimIII_data, masinisIII_data, masinisIV_data]

    for config in configs:
        try:
            result = database.create_rotation_config(**config)
            print(f"✅ {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"❌ Failed to create {config['job_title']}: {str(e)}")


def migrate_rotation_container_data():
    """
    Migrate data dari RotationContainer.tsx
    Type: container
    Jobs: nakhoda, KKM, mualimI, masinisII
    """

    print("\n" + "=" * 70)
    print("MIGRATING ROTATION CONTAINER DATA (type: container)")
    print("=" * 70 + "\n")

    # ============ NAKHODA ============
    nakhoda_data = {
        "job_title": "nakhoda",
        "vessel": "D",
        "rotation_type": "container",  # ✅ Ubah dari 'type' ke 'rotation_type'
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
        "rotation_type": "container",  # ✅ Ubah dari 'type' ke 'rotation_type'
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
        "rotation_type": "container",  # ✅ Ubah dari 'type' ke 'rotation_type'
        "part": "deck",
        "groups": nakhoda_data["groups"],
    }

    # ============ MASINIS II ============
    masinisII_data = {
        "job_title": "masinisII",
        "vessel": "E",
        "rotation_type": "container",  # ✅ Ubah dari 'type' ke 'rotation_type'
        "part": "engine",
        "groups": kkm_data["groups"],
    }

    # Insert all container configs
    configs = [nakhoda_data, kkm_data, mualimI_data, masinisII_data]

    for config in configs:
        try:
            result = database.create_rotation_config(**config)
            print(f"✅ {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"❌ Failed to create {config['job_title']}: {str(e)}")


def migrate_rotation_manalagi_data():
    """
    Migrate data dari RotationKKM.tsx
    Type: manalagi
    Jobs: nakhoda (vessel F), KKM (vessel G)
    """

    print("\n" + "=" * 70)
    print("MIGRATING ROTATION MANALAGI DATA (type: manalagi)")
    print("=" * 70 + "\n")

    # ============ NAKHODA (Manalagi) ============
    nakhoda_manalagi_data = {
        "job_title": "nakhoda",
        "vessel": "F",
        "rotation_type": "manalagi",  # ✅ Ubah dari 'type' ke 'rotation_type'
        "part": "deck",
        "groups": {
            "container_rotation1": [
                "KM. MANALAGI PRITA",
                "KM. MANALAGI ASTA",
                "KM. MANALAGI ASTI",
                "KM. MANALAGI DASA",
                "KM. MANALAGI ENZI",
                "KM. MANALAGI TARA",
                "KM. MANALAGI WANDA",
            ],
            "container_rotation2": [
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
        "rotation_type": "manalagi",  # ✅ Ubah dari 'type' ke 'rotation_type'
        "part": "engine",
        "groups": {
            "manalagi_kkm1": [
                "KM. MANALAGI ASTA",
                "KM. MANALAGI ASTI",
                "KM. MANALAGI SAMBA",
                "KM. MANALAGI YASA",
                "KM. XYS SATU",
                "KM. MANALAGI WANDA",
            ],
            "manalagi_kkm2": [
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
            result = database.create_rotation_config(**config)
            print(f"✅ {result['message']} (ID: {result['id']})")
        except Exception as e:
            print(f"❌ Failed to create {config['job_title']}: {str(e)}")


if __name__ == "__main__":
    print("\n" + "🚀" * 35)
    print("STARTING DATA MIGRATION FROM REACT COMPONENTS TO DATABASE")
    print("🚀" * 35)

    # Run migrations
    migrate_rotation_schedule_data()
    migrate_rotation_container_data()
    migrate_rotation_manalagi_data()

    print("\n" + "✅" * 35)
    print("MIGRATION COMPLETE!")
    print("✅" * 35 + "\n")

    # Show summary
    print("Summary:")
    print(
        "  - Schedule Rotations: 4 configs (mualimII, mualimIII, masinisIII, masinisIV)"
    )
    print("  - Container Rotations: 4 configs (nakhoda, KKM, mualimI, masinisII)")
    print("  - Manalagi Rotations: 2 configs (nakhoda-F, KKM-G)")
    print("  - Total: 10 rotation configs migrated")
    print("\nNext steps:")
    print("  1. Verify data in database: SELECT * FROM rotation_configs;")
    print("  2. Update React components to fetch from API")
    print("  3. Remove hardcoded data from components\n")
