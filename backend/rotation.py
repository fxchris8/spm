import pandas as pd

from ai.model import filter_in_vessel, vessel_group_id_deck
from database.connection import get_seamen_as_data

# ============================================================================
# GLOBAL VARIABLES & CONFIGURATIONS
# ============================================================================

# Global variable to store index to first rotation date mapping
_last_index_to_first_date = {}


# ============================================================================
# BAGIAN 1: UTILITY FUNCTIONS
# ============================================================================


def add_first_rotation_date_column(df):
    """
    Add first_rotation_date column to crew DataFrame based on Index.
    Uses the global _last_index_to_first_date mapping from get_schedule.
    """
    global _last_index_to_first_date
    if "Index" in df.columns:
        df["first_rotation_date"] = df["Index"].map(
            lambda idx: _last_index_to_first_date.get(idx, "")
        )
    else:
        df["first_rotation_date"] = ""
    return df


# ============================================================================
# BAGIAN 2: VESSEL GROUP CONFIGURATIONS
# ============================================================================


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
        "KM. TELUK BINTUNI",
        "KM. PULAU LAYANG",
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
    "others": [
        "DARAT",
        "DARAT BIASA",
        "DARAT STAND-BY",
        "PENDING CUTI",
        "PENDING GAJI",
        "PENDING GAJI CUTI",
    ],
}


# Fungsi untuk mengonversi bulan dan tahun menjadi indeks bulan_list
def get_month_index(month_name, year):
    month_dict = {
        "January": 0,
        "February": 1,
        "March": 2,
        "April": 3,
        "May": 4,
        "June": 5,
        "July": 6,
        "August": 7,
        "September": 8,
        "October": 9,
        "November": 10,
        "December": 11,
    }
    return month_dict[month_name] + (year - year) * 12


# ============================================================================
# BAGIAN 3: CREW DATA FETCHING
# ============================================================================


def get_nganggur(job):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()
    filtered_cadangan = filter_in_vessel(local_df, "others", KELOMPOK)
    filtered_cadangan = filtered_cadangan[(filtered_cadangan["last_position"] == job)]
    filtered_cadangan = filtered_cadangan.sort_values(by="last_location")

    return filtered_cadangan[["name", "last_location", "seamancode"]]


# ============================================================================
# BAGIAN 4: ROTATION SCHEDULE GENERATION
# ============================================================================


def get_schedule(vessel_group_id_filter, new_nahkoda, type, part, job="NAKHODA"):
    """Tambahkan parameter job dengan default NAKHODA"""
    local_df = get_seamen_as_data()

    filtered_df = filter_in_vessel(local_df, type, KELOMPOK)
    filtered_df = vessel_group_id_deck(filtered_df, type, part)

    # Filter berdasarkan job (bukan hardcoded "NAKHODA")
    filtered_df_nahkoda = filtered_df[
        (filtered_df["last_position"] == job)  # ← PAKAI PARAMETER JOB
        & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
    ].copy()  # ← Tambahkan .copy()

    # Pastikan end_date dalam format datetime
    filtered_df_nahkoda["end_date"] = pd.to_datetime(
        filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
    )

    # Urutkan berdasarkan end_date
    filtered_df_nahkoda = filtered_df_nahkoda.sort_values(by="end_date")

    # Daftar kapal unik
    kapal_list = filtered_df_nahkoda["last_location"].dropna().unique()

    # Ambil bulan sekarang + 1
    today = pd.Timestamp.today()
    min_start_date = (today + pd.DateOffset(months=1)).replace(day=1)
    min_start_month = min_start_date.strftime("%B")
    min_start_year = min_start_date.year

    # Buat bulan_list
    bulan_list = [
        f"{month} {year}"
        for year in range(min_start_year, min_start_year + 3)
        for month in [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]
    ]

    # Buat DataFrame untuk jadwal rotasi
    schedule = pd.DataFrame(index=kapal_list, columns=bulan_list)

    # Tambahkan cadangan
    if new_nahkoda:
        cadangan_list = []
        for code in new_nahkoda:
            row = {
                "seamancode": code,
                "VESSEL GROUP ID": vessel_group_id_filter,
                "last_position": job,  # ← PAKAI PARAMETER JOB
            }
            cadangan_list.append(row)
        cadangan = pd.DataFrame(cadangan_list)
        filtered_df_nahkoda = pd.concat(
            [cadangan, filtered_df_nahkoda], ignore_index=True, sort=False
        )

    alphabet = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", alphabet)

    month_index = get_month_index(min_start_month, min_start_year)
    durasi_penugasan = len(kapal_list)
    available_nahkoda = [alphabet[-1]] + alphabet[:-1]
    used_nahkoda = []
    nakhoda_terakhir_bertugas = {seamancode: None for seamancode in available_nahkoda}

    while month_index < len(bulan_list):
        month = bulan_list[month_index]
        # print(f"--- Bulan: {month} ({job}) ---")  # ← Print job yang benar
        transaction = False

        if not available_nahkoda:
            # print(f"Semua {job} sudah digunakan, mereset daftar")  # ← Print job
            available_nahkoda = used_nahkoda
            used_nahkoda = []

        for i, kapal in enumerate(kapal_list):
            if pd.isna(schedule.at[kapal, month]) and not transaction:
                if available_nahkoda:
                    nakhoda = available_nahkoda.pop(0)
                    # print(f"Menugaskan {job} {nakhoda} ke kapal {kapal}")  # ← Print job

                    for j in range(durasi_penugasan):
                        if month_index + j < len(bulan_list):
                            target_month = bulan_list[month_index + j]
                            schedule.at[kapal, target_month] = nakhoda

                    nakhoda_terakhir_bertugas[nakhoda] = month_index
                    used_nahkoda.append(nakhoda)
                    transaction = True
                    break

        if transaction:
            month_index += 1

    # print(filtered_df_nahkoda)
    # print(f"\nJadwal akhir untuk {job}:")  # ← Print job

    pd.set_option("display.max_rows", None)
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 1000)

    schedule = schedule.reset_index().rename(columns={"index": "Ship"})

    # Tambahkan kolom tanggal rotasi pertama
    first_rotation_dates = []
    for idx, row in schedule.iterrows():
        first_date = ""
        for col in schedule.columns[1:]:
            if pd.notna(row[col]) and row[col] != "":
                try:
                    first_date = pd.to_datetime(f"01 {col}", format="%d %B %Y")
                    first_date = first_date.strftime("%d-%m-%Y")
                except Exception as e:
                    print(f"Error parsing date: {e}")
                    first_date = col
                break
        first_rotation_dates.append(first_date)

    schedule["First Rotation Date"] = first_rotation_dates

    # Reorder columns: Ship, First Rotation Date, then all month columns
    ship_col = ["Ship"]
    first_rotation_col = ["First Rotation Date"]
    month_cols = [
        col for col in schedule.columns if col not in ["Ship", "First Rotation Date"]
    ]
    schedule = schedule[ship_col + first_rotation_col + month_cols]

    # Create a mapping of Index (A, B, C, etc.) to First Rotation Date
    # by finding the first month each index appears in the schedule
    index_to_first_date = {}
    for col in schedule.columns[2:]:  # Skip 'Ship' and 'First Rotation Date' columns
        for idx, row in schedule.iterrows():
            crew_index = row[col]
            if (
                pd.notna(crew_index)
                and crew_index != ""
                and crew_index not in index_to_first_date
            ):
                # This is the first appearance of this crew index
                try:
                    first_date = pd.to_datetime(f"01 {col}", format="%d %B %Y")
                    index_to_first_date[crew_index] = first_date.strftime(
                        "%a, %d %b %Y %H:%M:%S GMT"
                    )
                except Exception:
                    pass

    # Store the mapping globally for use by get_nahkoda and other functions
    global _last_index_to_first_date
    _last_index_to_first_date = index_to_first_date

    return schedule.fillna("")


# ============================================================================
# BAGIAN 5: JOB-SPECIFIC ROTATION FUNCTIONS
# ============================================================================


def get_nahkoda(vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL"):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df = filter_in_vessel(local_df, type, KELOMPOK)
        filtered_df = vessel_group_id_deck(filtered_df, type, part)

        filtered_df_nahkoda = filtered_df[
            (filtered_df["last_position"] == "NAKHODA")
            & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
        ].copy()
    else:
        filtered_df_nahkoda = pd.DataFrame()

    # Convert 'end_date' to datetime if exists
    if "end_date" in filtered_df_nahkoda.columns:
        filtered_df_nahkoda["end_date"] = pd.to_datetime(
            filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
        )
        filtered_df_nahkoda = filtered_df_nahkoda.sort_values(
            by="end_date", ascending=True
        )
        filtered_df_nahkoda["end_date"] = filtered_df_nahkoda["end_date"].dt.strftime(
            "%a, %d %b %Y %H:%M:%S GMT"
        )
    else:
        filtered_df_nahkoda["end_date"] = ""

    # Add cadangan (new_nahkoda)
    cadangan_list = []
    for code in new_nahkoda or []:
        person = local_df[local_df["seamancode"] == int(code)]
        if not person.empty:
            person_data = person.iloc[0]
            row = {
                "seamancode": code,
                "last_location": person_data.get("last_location", ""),
                "name": person_data.get("name", ""),
                "start_date": person_data.get("start_date", ""),
                "end_date": person_data.get("end_date", ""),
            }
            cadangan_list.append(row)

    if cadangan_list:
        cadangan_df = pd.DataFrame(cadangan_list)
        filtered_df_nahkoda = pd.concat(
            [filtered_df_nahkoda, cadangan_df], ignore_index=True, sort=False
        )

    # Tambah Index huruf (A, B, C... untuk crew biasa, Z0, Z1, Z2... untuk reliever)
    if quantity == "ONE":
        # Untuk reliever (cadangan2), gunakan Z0, Z1, Z2...
        index_list = [f"Z{i}" for i in range(len(filtered_df_nahkoda))]
    else:
        # Untuk crew biasa, gunakan A, B, C...
        index_list = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", index_list)

    # Pastikan kolom lengkap
    for col in ["name", "last_location", "seamancode", "start_date", "end_date"]:
        if col not in filtered_df_nahkoda.columns:
            filtered_df_nahkoda[col] = ""

    # Add first_rotation_date column
    filtered_df_nahkoda = add_first_rotation_date_column(filtered_df_nahkoda)

    return filtered_df_nahkoda[
        [
            "Index",
            "name",
            "last_location",
            "seamancode",
            "start_date",
            "end_date",
            "first_rotation_date",
        ]
    ]


def get_kkm(vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL"):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df = filter_in_vessel(local_df, type, KELOMPOK)
        filtered_df = vessel_group_id_deck(filtered_df, type, part)

        filtered_df_nahkoda = filtered_df[
            (filtered_df["last_position"] == "KKM")
            & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
        ].copy()
    else:
        filtered_df_nahkoda = pd.DataFrame()

    # Convert 'end_date' to datetime if exists
    if "end_date" in filtered_df_nahkoda.columns:
        filtered_df_nahkoda["end_date"] = pd.to_datetime(
            filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
        )
        filtered_df_nahkoda = filtered_df_nahkoda.sort_values(
            by="end_date", ascending=True
        )
        filtered_df_nahkoda["end_date"] = filtered_df_nahkoda["end_date"].dt.strftime(
            "%a, %d %b %Y %H:%M:%S GMT"
        )
    else:
        filtered_df_nahkoda["end_date"] = ""

    # Add cadangan (new_nahkoda)
    cadangan_list = []
    for code in new_nahkoda or []:
        person = local_df[local_df["seamancode"] == int(code)]
        if not person.empty:
            person_data = person.iloc[0]
            row = {
                "seamancode": code,
                "last_location": person_data.get("last_location", ""),
                "name": person_data.get("name", ""),
                "start_date": person_data.get("start_date", ""),
                "end_date": person_data.get("end_date", ""),
            }
            cadangan_list.append(row)

    if cadangan_list:
        cadangan_df = pd.DataFrame(cadangan_list)
        filtered_df_nahkoda = pd.concat(
            [filtered_df_nahkoda, cadangan_df], ignore_index=True, sort=False
        )

    # Tambah Index huruf (A, B, C... untuk crew biasa, Z0, Z1, Z2... untuk reliever)
    if quantity == "ONE":
        # Untuk reliever (cadangan2), gunakan Z0, Z1, Z2...
        index_list = [f"Z{i}" for i in range(len(filtered_df_nahkoda))]
    else:
        # Untuk crew biasa, gunakan A, B, C...
        index_list = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", index_list)

    # Pastikan kolom lengkap
    for col in ["name", "last_location", "seamancode", "start_date", "end_date"]:
        if col not in filtered_df_nahkoda.columns:
            filtered_df_nahkoda[col] = ""

    # Add first_rotation_date column
    filtered_df_nahkoda = add_first_rotation_date_column(filtered_df_nahkoda)

    return filtered_df_nahkoda[
        [
            "Index",
            "name",
            "last_location",
            "seamancode",
            "start_date",
            "end_date",
            "first_rotation_date",
        ]
    ]


def get_mualimI(vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL"):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df = filter_in_vessel(local_df, type, KELOMPOK)
        filtered_df = vessel_group_id_deck(filtered_df, type, part)

        filtered_df_nahkoda = filtered_df[
            (filtered_df["last_position"] == "MUALIM I")
            & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
        ].copy()
    else:
        filtered_df_nahkoda = pd.DataFrame()

    # Convert 'end_date' to datetime if exists
    if "end_date" in filtered_df_nahkoda.columns:
        filtered_df_nahkoda["end_date"] = pd.to_datetime(
            filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
        )
        filtered_df_nahkoda = filtered_df_nahkoda.sort_values(
            by="end_date", ascending=True
        )
        filtered_df_nahkoda["end_date"] = filtered_df_nahkoda["end_date"].dt.strftime(
            "%a, %d %b %Y %H:%M:%S GMT"
        )
    else:
        filtered_df_nahkoda["end_date"] = ""

    # Add cadangan (new_nahkoda)
    cadangan_list = []
    for code in new_nahkoda or []:
        person = local_df[local_df["seamancode"] == int(code)]
        if not person.empty:
            person_data = person.iloc[0]
            row = {
                "seamancode": code,
                "last_location": person_data.get("last_location", ""),
                "name": person_data.get("name", ""),
                "start_date": person_data.get("start_date", ""),
                "end_date": person_data.get("end_date", ""),
            }
            cadangan_list.append(row)

    if cadangan_list:
        cadangan_df = pd.DataFrame(cadangan_list)
        filtered_df_nahkoda = pd.concat(
            [filtered_df_nahkoda, cadangan_df], ignore_index=True, sort=False
        )

    # Tambah Index huruf (A, B, C... untuk crew biasa, Z0, Z1, Z2... untuk reliever)
    if quantity == "ONE":
        # Untuk reliever (cadangan2), gunakan Z0, Z1, Z2...
        index_list = [f"Z{i}" for i in range(len(filtered_df_nahkoda))]
    else:
        # Untuk crew biasa, gunakan A, B, C...
        index_list = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", index_list)

    # Pastikan kolom lengkap
    for col in ["name", "last_location", "seamancode", "start_date", "end_date"]:
        if col not in filtered_df_nahkoda.columns:
            filtered_df_nahkoda[col] = ""

    # Add first_rotation_date column
    filtered_df_nahkoda = add_first_rotation_date_column(filtered_df_nahkoda)

    return filtered_df_nahkoda[
        [
            "Index",
            "name",
            "last_location",
            "seamancode",
            "start_date",
            "end_date",
            "first_rotation_date",
        ]
    ]


def get_masinisII(vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL"):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df = filter_in_vessel(local_df, type, KELOMPOK)
        filtered_df = vessel_group_id_deck(filtered_df, type, part)

        filtered_df_nahkoda = filtered_df[
            (filtered_df["last_position"] == "MASINIS II")
            & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
        ].copy()
    else:
        filtered_df_nahkoda = pd.DataFrame()

    # Convert 'end_date' to datetime if exists
    if "end_date" in filtered_df_nahkoda.columns:
        filtered_df_nahkoda["end_date"] = pd.to_datetime(
            filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
        )
        filtered_df_nahkoda = filtered_df_nahkoda.sort_values(
            by="end_date", ascending=True
        )
        filtered_df_nahkoda["end_date"] = filtered_df_nahkoda["end_date"].dt.strftime(
            "%a, %d %b %Y %H:%M:%S GMT"
        )
    else:
        filtered_df_nahkoda["end_date"] = ""

    # Add cadangan (new_nahkoda)
    cadangan_list = []
    for code in new_nahkoda or []:
        person = local_df[local_df["seamancode"] == int(code)]
        if not person.empty:
            person_data = person.iloc[0]
            row = {
                "seamancode": code,
                "last_location": person_data.get("last_location", ""),
                "name": person_data.get("name", ""),
                "start_date": person_data.get("start_date", ""),
                "end_date": person_data.get("end_date", ""),
            }
            cadangan_list.append(row)

    if cadangan_list:
        cadangan_df = pd.DataFrame(cadangan_list)
        filtered_df_nahkoda = pd.concat(
            [filtered_df_nahkoda, cadangan_df], ignore_index=True, sort=False
        )

    # Tambah Index huruf (A, B, C... untuk crew biasa, Z0, Z1, Z2... untuk reliever)
    if quantity == "ONE":
        # Untuk reliever (cadangan2), gunakan Z0, Z1, Z2...
        index_list = [f"Z{i}" for i in range(len(filtered_df_nahkoda))]
    else:
        # Untuk crew biasa, gunakan A, B, C...
        index_list = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", index_list)

    # Pastikan kolom lengkap
    for col in ["name", "last_location", "seamancode", "start_date", "end_date"]:
        if col not in filtered_df_nahkoda.columns:
            filtered_df_nahkoda[col] = ""

    # Add first_rotation_date column
    filtered_df_nahkoda = add_first_rotation_date_column(filtered_df_nahkoda)

    return filtered_df_nahkoda[
        [
            "Index",
            "name",
            "last_location",
            "seamancode",
            "start_date",
            "end_date",
            "first_rotation_date",
        ]
    ]
