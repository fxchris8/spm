import re

import pandas as pd

from ai.model import filter_in_vessel, vessel_group_id_deck
from database.connection import get_seamen_as_data
from utils.vessel_normalizer import normalize_vessel_name, normalize_vessel_set

# ============================================================================
# GLOBAL VARIABLES & CONFIGURATIONS
# ============================================================================

# Global variable to store index to first rotation date mapping
_last_index_to_first_date = {}


# ============================================================================
# BAGIAN 1: UTILITY FUNCTIONS
# ============================================================================


def normalize_ship_names(ship_names):
    """
    Normalize ship names while preserving their configured order.
    """
    if ship_names is None:
        return []
    if isinstance(ship_names, str):
        ship_names = [ship_names]

    normalized = []
    seen = set()
    for ship_name in ship_names:
        if pd.isna(ship_name):
            continue
        ship_name = str(ship_name).strip()
        if ship_name and ship_name not in seen:
            normalized.append(ship_name)
            seen.add(ship_name)

    return normalized


def get_rotation_group_number(group_key):
    match = re.search(r"rotation(\d+)$", str(group_key))
    if not match:
        return None
    return str(int(match.group(1)))


JOB_TO_TITLE = {
    "NAKHODA": "nakhoda",
    "KKM": "KKM",
    "MUALIM I": "mualimI",
    "MASINIS II": "masinisII",
    "MUALIM II": "mualimII",
    "MUALIM III": "mualimIII",
    "MASINIS III": "masinisIII",
    "MASINIS IV": "masinisIV",
}


def get_configured_ship_names(
    vessel_group_id_filter, categorization, part, job_title=None
):
    """
    Resolve ship names from vessel management config using IDs like D9/E3/F1.
    """
    try:
        from repositories.vessel_repository import get_vessel_config_from_db

        prefix, groups = get_vessel_config_from_db(
            categorization, part, job_title=job_title
        )
        if not prefix or not groups:
            return []

        group_id = str(vessel_group_id_filter or "")
        if not group_id.startswith(prefix):
            return []

        group_number = group_id[len(prefix) :]
        if not group_number.isdigit():
            return []

        normalized_group_number = str(int(group_number))
        numbered_groups = {
            parsed_number: ships
            for group_key, ships in groups.items()
            if (parsed_number := get_rotation_group_number(group_key)) is not None
        }

        if numbered_groups:
            return normalize_ship_names(
                numbered_groups.get(normalized_group_number, [])
            )

        group_index = int(normalized_group_number) - 1
        group_ship_lists = list(groups.values())
        if 0 <= group_index < len(group_ship_lists):
            return normalize_ship_names(group_ship_lists[group_index])

        return []
    except Exception as e:
        print(f"WARN - Could not resolve configured ships: {e}")
        return []


def get_group_job_crew(
    local_df, vessel_group_id_filter, type, part, job, vessel_names=None
):
    filtered_df = filter_in_vessel(local_df, type)
    job_title = JOB_TO_TITLE.get(job, job.lower() if job else None)
    filtered_df = vessel_group_id_deck(filtered_df, type, part, job_title=job_title)

    group_crew = filtered_df[
        (filtered_df["last_position"] == job)
        & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
    ].copy()

    if not group_crew.empty:
        return group_crew

    fallback_vessels = normalize_ship_names(vessel_names)
    if not fallback_vessels:
        fallback_vessels = get_configured_ship_names(
            vessel_group_id_filter, type, part, job_title=job_title
        )

    if not fallback_vessels:
        return group_crew

    fallback_norm = normalize_vessel_set(fallback_vessels)
    loc_norm = filtered_df["last_location"].apply(normalize_vessel_name)

    return filtered_df[
        (filtered_df["last_position"] == job)
        & (filtered_df["last_location"].isin(fallback_vessels) | loc_norm.isin(fallback_norm))
    ].copy()


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
# KELOMPOK tidak lagi di-hardcode di sini.
# Data diambil dari database via repositories/vessel_repository.py
# sehingga konsisten dengan konfigurasi yang dikelola melalui Vessel Management UI.


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
    filtered_cadangan = filter_in_vessel(local_df, "others")
    filtered_cadangan = filtered_cadangan[(filtered_cadangan["last_position"] == job)]
    filtered_cadangan = filtered_cadangan.sort_values(by="last_location")

    return filtered_cadangan[["name", "last_location", "seamancode"]]


# ============================================================================
# BAGIAN 4: ROTATION SCHEDULE GENERATION
# ============================================================================


def get_schedule(
    vessel_group_id_filter,
    new_nahkoda,
    type,
    part,
    job="NAKHODA",
    month_offset: int = 1,
    vessel_names=None,
):
    """Tambahkan parameter job dengan default NAKHODA, dan month_offset untuk forecasting."""
    local_df = get_seamen_as_data()

    filtered_df_nahkoda = get_group_job_crew(
        local_df, vessel_group_id_filter, type, part, job, vessel_names
    )

    # Pastikan end_date dalam format datetime
    filtered_df_nahkoda["end_date"] = pd.to_datetime(
        filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
    )

    # Urutkan berdasarkan end_date
    filtered_df_nahkoda = filtered_df_nahkoda.sort_values(by="end_date")

    # Daftar kapal dari konfigurasi UI/DB menjadi fallback untuk grup baru
    configured_kapal_list = normalize_ship_names(vessel_names)
    if not configured_kapal_list:
        job_title = JOB_TO_TITLE.get(job, job.lower() if job else None)
        configured_kapal_list = get_configured_ship_names(
            vessel_group_id_filter, type, part, job_title=job_title
        )

    data_kapal_list = normalize_ship_names(
        filtered_df_nahkoda["last_location"].dropna().unique()
    )
    kapal_list = data_kapal_list or configured_kapal_list

    # Ambil bulan target berdasarkan month_offset (1 = bulan depan, 2 = 2 bulan ke depan, dst)
    today = pd.Timestamp.today()
    min_start_date = (today + pd.DateOffset(months=month_offset)).replace(day=1)
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

    if filtered_df_nahkoda.empty:
        raise ValueError(f"Tidak ada crew atau cadangan {job} untuk membuat schedule.")

    alphabet = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", alphabet)

    month_index = get_month_index(min_start_month, min_start_year)
    durasi_penugasan = len(kapal_list)
    if alphabet and len(kapal_list) > 0:
        available_nahkoda = [alphabet[-1]] + alphabet[:-1]
        used_nahkoda = []
        nakhoda_terakhir_bertugas = {
            seamancode: None for seamancode in available_nahkoda
        }

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


def get_nahkoda(
    vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL", vessel_names=None
):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df_nahkoda = get_group_job_crew(
            local_df, vessel_group_id_filter, type, part, "NAKHODA", vessel_names
        )
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


def get_kkm(
    vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL", vessel_names=None
):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df_nahkoda = get_group_job_crew(
            local_df, vessel_group_id_filter, type, part, "KKM", vessel_names
        )
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


def get_mualimI(
    vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL", vessel_names=None
):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df_nahkoda = get_group_job_crew(
            local_df, vessel_group_id_filter, type, part, "MUALIM I", vessel_names
        )
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


def get_masinisII(
    vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL", vessel_names=None
):
    # Load from Supabase instead of Excel
    local_df = get_seamen_as_data()

    if quantity != "ONE":
        filtered_df_nahkoda = get_group_job_crew(
            local_df, vessel_group_id_filter, type, part, "MASINIS II", vessel_names
        )
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
