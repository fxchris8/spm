import pandas as pd

# app = Flask(__name__)
# app.secret_key = 'supersecretkey'

SHIP_GROUPS = {
    "manalagi_rotation": [
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
    "manalagi_kkm": [
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
    "container_kkm1": [
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
    "container_kkm2": [
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
    "container_kkm3": [
        "KM. ORIENTAL PACIFIC",
        "KM. ORIENTAL SAMUDERA",
        "KM. ARMADA SEGARA",
        "KM. ARMADA SENADA",
        "KM. ARMADA SERASI",
        "KM. SPIL RATNA",
        "KM. SPIL RUMI",
        "KM. PULAU NUNUKAN",
    ],
    "container_kkm4": [
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
    "container_kkm5": [
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
    "container_kkm6": [
        "KM. PRATIWI RAYA",
        "KM. PRATIWI SATU",
        "KM. BALI AYU",
        "KM. BALI GIANYAR",
        "KM. BALI SANUR",
        "KM. BALI KUTA",
    ],
    "container_kkm7": [
        "KM. MAGELLAN",
        "KM. MULIANIM",
        "KM. PAHALA",
        "KM. FORTUNE",
        "KM. AKASHIA",
        "KM. DERAJAT",
    ],
}

KELOMPOK = {
    "container": [
        "KM. ORIENTAL EMERALD",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL JADE",
        "KM. ARMADA SEJATI",
        "KM. ORIENTAL DIAMOND",
        "KM. LUZON",
        "KM. BALI AYU",
        "KM. VERIZON",
        "KM. ORIENTAL GALAXY",
        "KM. HIJAU SAMUDRA",
        "KM. ARMADA PERMATA",
        "KM. ORIENTAL SAMUDERA",
        "KM. ORIENTAL PACIFIC",
        "KM. PULAU NUNUKAN",
        "KM. TELUK FLAMINGGO",
        "KM. TELUK BERAU",
        "KM. MANALAGI YASA",
        "KM. TELUK BINTUNI",
        "KM. PULAU LAYANG",
        "KM. MANALAGI ASTI",
        "KM. PULAU WETAR",
        "KM. PULAU HOKI",
        "KM. SPIL HANA",
        "KM. SPIL HASYA",
        "KM. SPIL HAPSRI",
        "KM. SPIL HAYU",
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
        "KM. SPIL RAHAYU",
        "KM. SPIL RETNO",
        "KM. MINAS BARU",
        "KM. PEKAN SAMPIT",
        "KM. SELILI BARU",
        "KM. DERAJAT",
        "KM. MULIANIM",
        "KM. PRATIWI RAYA",
        "KM. MAGELLAN",
        "KM. PAHALA",
        "KM. PEKAN RIAU",
        "KM. PEKAN FAJAR",
        "KM. PEKAN BERAU",
        "KM. FORTUNE",
        "KM. PRATIWI SATU",
        "KM. BALI AYU",
        "KM. BALI GIANYAR",
        "KM. BALI KUTA",
        "KM. BALI SANUR",
        "KM. AKASHIA",
        "KM. KAPPA",
    ],
    "manalagi": [
        "KM. MANALAGI ASTA",
        "KM. MANALAGI ASTI",
        "KM. MANALAGI DASA",
        "KM. MANALAGI ENZI",
        "KM. MANALAGI HITA",
        "KM. MANALAGI SAMBA",
        "KM. MANALAGI TARA",
        "KM. MANALAGI TISYA",
        "KM. MANALAGI VIRA",
        "KM. MANALAGI WANDA",
        "KM. MANALAGI YASA",
        "KM. XYS SATU",
    ],
    "bc": [
        "BC. ANGSA LAUT",
        "BC. BALIKPAPAN RAYA",
        "BC. BANJARMASIN RAYA",
        "BC. BAYA",
        "BC. BELAWAN RAYA",
        "BC. EPSILON",
        "BC. GAJAH LAUT",
        "BC. GAJAH MADA",
        "BC. KAIMANA INDAH",
        "BC. MURO 5",
        "BC. SAMARINDA RAYA",
        "BC. SHORYU BARU",
        "BC. SURABAYA RAYA",
        "BC. TARAKAN RAYA",
        "BC. TENYO MARU",
    ],
    "mt": ["MT. GLOBAL", "MT. PANTAI LAMONG"],
    "tb": [
        "TB. ALPHA",
        "TB. CAPUNG I",
        "TB. CAPUNG II",
        "TB. CAPUNG III",
        "TB. GAMMA SATU",
        "TB. MANGGA RAYA",
        "TB. SPIL BOAT",
        "TB. TOYO",
        "TB. YITNA YUWANA",
        "TB. YUSHIN MARU",
    ],
    "tk": ["TK. BETA SATU", "TK. DELTA DUA"],
    "others": ["DARAT", "Stand by Crew", "PENDING GAJI CUTI", "PENDING GAJI"],
}

# Load the seamen data
combined_df = pd.read_excel("../data/Data_Seamen_API.xlsx")


def filter_in_vessel(dataframe, group_name, kelompok=KELOMPOK):
    if group_name not in kelompok:
        raise ValueError(f"Group '{group_name}' tidak ditemukan dalam kelompok.")

    # Ambil daftar VESSEL untuk group tertentu
    vessel_list = kelompok[group_name]

    # Filter DataFrame berdasarkan kolom 'VESSEL'
    filtered_df = dataframe[dataframe["last_location"].isin(vessel_list)]

    return filtered_df


def vessel_group_id_deck(dataframe, vessel, type):
    """
    Menambahkan kolom 'VESSEL GROUP ID' ke dalam DataFrame berdasarkan tipe pengelompokan.

    Parameters:
        dataframe (pd.DataFrame): DataFrame input yang memiliki kolom 'VESSEL'.
        type (str): Jenis pengelompokan, bisa 'deck' atau 'engine'.

    Returns:
        pd.DataFrame: DataFrame dengan kolom tambahan 'VESSEL GROUP ID'.
    """
    # Definisi grup untuk deck dan engine
    CONTAINER_DECK = {
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
    }

    CONTAINER_ENGINE = {
        "container_kkm1": [
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
        "container_kkm2": [
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
        "container_kkm3": [
            "KM. ORIENTAL PACIFIC",
            "KM. ORIENTAL SAMUDERA",
            "KM. ARMADA SEGARA",
            "KM. ARMADA SENADA",
            "KM. ARMADA SERASI",
            "KM. SPIL RATNA",
            "KM. SPIL RUMI",
            "KM. PULAU NUNUKAN",
        ],
        "container_kkm4": [
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
        "container_kkm5": [
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
        "container_kkm6": [
            "KM. PRATIWI RAYA",
            "KM. PRATIWI SATU",
            "KM. BALI AYU",
            "KM. BALI GIANYAR",
            "KM. BALI SANUR",
            "KM. BALI KUTA",
        ],
        "container_kkm7": [
            "KM. MAGELLAN",
            "KM. MULIANIM",
            "KM. PAHALA",
            "KM. FORTUNE",
            "KM. AKASHIA",
            "KM. DERAJAT",
        ],
    }

    MANALAGI_DECK = {
        "manalagi_rotation": [
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
    }

    MANALAGI_ENGINE = {
        "manalagi_kkm": [
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
    }

    # Pilih grup berdasarkan tipe
    if type == "deck" and vessel == "container":
        groups = CONTAINER_DECK
        prefix = "D"
    elif type == "engine" and vessel == "container":
        groups = CONTAINER_ENGINE
        prefix = "E"
    elif type == "deck" and vessel == "manalagi":
        groups = MANALAGI_DECK
        prefix = "F"
    elif type == "engine" and vessel == "manalagi":
        groups = MANALAGI_ENGINE
        prefix = "G"
    else:
        raise ValueError("Parameter 'type' harus bernilai 'deck' atau 'engine'")

    # Buat mapping VESSEL ke VESSEL GROUP ID
    vessel_to_group = {}
    for idx, (group_name, vessels) in enumerate(groups.items(), start=1):
        group_id = (
            f"{prefix}{idx}"  # Format group ID seperti D1, D2, ... atau E1, E2, ...
        )
        for vessel in vessels:
            vessel_to_group[vessel] = group_id

    # Tambahkan kolom baru berdasarkan mapping
    dataframe["VESSEL GROUP ID"] = (
        dataframe["last_location"].map(vessel_to_group).fillna("UNKNOWN")
    )

    # Menyisipkan kolom 'VESSEL GROUP ID' setelah kolom 'VESSEL'
    cols = dataframe.columns.tolist()
    vessel_idx = cols.index("last_location")  # Dapatkan indeks kolom 'VESSEL'
    cols.insert(
        vessel_idx + 1, cols.pop(cols.index("VESSEL GROUP ID"))
    )  # Pindahkan 'VESSEL GROUP ID' setelah 'VESSEL'
    dataframe = dataframe[cols]

    return dataframe


filtered_df = filter_in_vessel(combined_df, "container", KELOMPOK)
# print(filtered_df['last_location'].unique())
filtered_df = vessel_group_id_deck(filtered_df, "container", "deck")


print(filtered_df)
