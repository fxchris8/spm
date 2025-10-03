import json
import os

import pandas as pd
import requests

from test_module import filter_in_vessel, vessel_group_id_deck

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
        "Stand by Crew",
        "PENDING CUTI",
        "PENDING GAJI",
        "PENDING CUTI",
    ],
}


# Fungsi untuk mengonversi bulan dan tahun menjadi indeks bulan_list
def fetch_and_save_data():
    print("Fetching data from the API...")

    url = "http://nanika.spil.co.id:3021/get-seamen"

    payload = json.dumps(
        {
            "age": 0,
            "status": "",
            "education": "",
            "experience": "",
            "certificate": "",
            "last_location": "",
            "last_position": "",
        }
    )

    headers = {"Content-Type": "application/json"}

    response = requests.get(url, headers=headers, data=payload)

    # Detailed logging
    print(f"Response status code: {response.status_code}")
    print(f"Response content: {response.text}")
    print(f"Response headers: {response.headers}")

    if response.status_code == 200:
        response_dict = response.json()  # Parse the response into a dictionary
        data_seamen = response_dict.get("data_seamen", [])

        if data_seamen:
            df = pd.DataFrame(data_seamen)

            # 💡 Use absolute path to main project-level "data" folder
            output_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "data")
            )
            os.makedirs(output_dir, exist_ok=True)

            output_file = os.path.join(output_dir, "Data_Seamen_API.xlsx")

            df.to_excel(output_file, index=False)
            print(f"Data successfully saved to {output_file}")
            return True
        else:
            print("No seamen data available.")
            return False
    else:
        print(f"Request failed with status code: {response.status_code}")
        return False


def fetch_and_save_mutasi_data():
    print("Fetching data from the API...")

    url = "http://nanika.spil.co.id:3021/get-mutation"

    payload = json.dumps(
        {
            "seaman_name": "",
            "transaction_date_1": "01/01/2020",
            "transaction_date_2": "01/01/2025",
            "from_rank_name": "",
            "to_rank_name": "",
            "from_vessel_code": "",
            "to_vessel_code": "",
            "jenis": "",
        }
    )

    headers = {"Content-Type": "application/json"}

    response = requests.get(url, headers=headers, data=payload)

    # Detailed logging
    print(f"Response status code: {response.status_code}")
    print(f"Response content: {response.text}")
    print(f"Response headers: {response.headers}")

    if response.status_code == 200:
        response_dict = response.json()  # Parse the response into a dictionary
        data_mutation = response_dict.get("data_mutation", [])

        if data_mutation:
            df = pd.DataFrame(data_mutation)

            # 💡 Use absolute path to main project-level "data" folder
            output_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "data")
            )
            os.makedirs(output_dir, exist_ok=True)

            output_file = os.path.join(output_dir, "Data_Mutasi_API.xlsx")

            df.to_excel(output_file, index=False)
            print(f"Data successfully saved to {output_file}")
            return True
        else:
            print("No seamen data available.")
            return False
    else:
        print(f"Request failed with status code: {response.status_code}")
        return False


# def test_fetch():
#     url = "http://nanika.spil.co.id:3021/get-seamen"
#     payload = json.dumps({
#         "age": 0, "status": "", "education": "", "experience": "",
#         "certificate": "", "last_location": "", "last_position": ""
#     })
#     headers = {'Content-Type': 'application/json'}

#     response = requests.get(url, headers=headers, data=payload)

#     print(f"Status: {response.status_code}")
#     print(f"Success: {response.json().get('success')}")
#     print(f"Seamen count: {len(response.json().get('data_seamen', []))}")

#     data = response.json().get("data_seamen", [])
#     if data:
#         df = pd.DataFrame(data)
#         print(f"Saving {len(df)} rows...")
#         os.makedirs("data", exist_ok=True)
#         df.to_excel("data/Data_Seamen_API1.xlsx", index=False)
#         print("Saved successfully.")
#     else:
#         print("No data returned.")


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


def get_nganggur(job):
    local_df = pd.read_excel("../data/Data_Seamen_API.xlsx")
    filtered_cadangan = filter_in_vessel(local_df, "others", KELOMPOK)
    filtered_cadangan = filtered_cadangan[(filtered_cadangan["last_position"] == job)]
    filtered_cadangan = filtered_cadangan.sort_values(by="last_location")

    return filtered_cadangan[["name", "last_location", "seamancode"]]


def get_schedule(vessel_group_id_filter, new_nahkoda, type, part):
    local_df = pd.read_excel("../data/Data_Seamen_API.xlsx")

    filtered_df = filter_in_vessel(local_df, type, KELOMPOK)

    filtered_df = vessel_group_id_deck(filtered_df, type, part)

    filtered_df_nahkoda = filtered_df[
        (filtered_df["last_position"] == "NAKHODA")
        & (filtered_df["VESSEL GROUP ID"] == vessel_group_id_filter)
    ]

    # Data baru yang ingin ditambahkan (cadangan)
    # new_nahkoda = {
    #     "age": 35,
    #     "certificate": "ANT-I",
    #     "day_remains": 200,
    #     "edu_level": "S1",
    #     "end_date": "31/12/2025",
    #     "experience": ">5 Tahun",
    #     "gender": "Pria",
    #     "last_location": "Pelabuhan XYZ",
    #     "VESSEL GROUP ID": vessel_group_id_filter,  # Sama dengan grup filter
    #     "last_position": "NAKHODA",
    #     "name": "- (cadangan)",
    #     "no": "999",
    #     "phone_number_1": "081234567890",
    #     "phone_number_2": "",
    #     "phone_number_3": "",
    #     "phone_number_4": "",
    #     "seafarercode": "999999",
    #     "seamancode": "999999",
    #     "start_date": "01/01/2024",
    #     "status": "OFF"
    # }

    # Pastikan end_date dalam format datetime
    filtered_df_nahkoda["end_date"] = pd.to_datetime(
        filtered_df_nahkoda["end_date"], errors="coerce", dayfirst=True
    )

    # Urutkan berdasarkan end_date agar yang lebih lama selesai lebih dulu bertugas lebih dulu
    filtered_df_nahkoda = filtered_df_nahkoda.sort_values(by="end_date")

    # Daftar kapal unik
    kapal_list = filtered_df_nahkoda["last_location"].dropna().unique()

    # Ambil bulan sekarang + 1
    today = pd.Timestamp.today()
    min_start_date = (today + pd.DateOffset(months=1)).replace(day=1)
    min_start_month = min_start_date.strftime("%B")
    min_start_year = min_start_date.year

    # Buat bulan_list dari bulan terendah hingga dua tahun ke depan
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

    # Buat DataFrame untuk jadwal rotasi kapal vs bulan
    schedule = pd.DataFrame(index=kapal_list, columns=bulan_list)

    # **Tambahkan cadangan nahkoda ke index pertama**
    if new_nahkoda:
        cadangan_list = []
        for code in new_nahkoda:
            row = {
                "seamancode": code,
                "VESSEL GROUP ID": vessel_group_id_filter,  # Sesuaikan dengan kebutuhan
                "last_position": "NAKHODA",
            }
            cadangan_list.append(row)
        cadangan = pd.DataFrame(cadangan_list)
        filtered_df_nahkoda = pd.concat(
            [cadangan, filtered_df_nahkoda], ignore_index=True, sort=False
        )

    alphabet = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", alphabet)
    # Menentukan indeks bulan awal dari bulan terendah
    month_index = get_month_index(min_start_month, min_start_year)

    # Durasi kerja nakhoda sebelum digantikan (sesuai jumlah kapal)
    durasi_penugasan = len(kapal_list)

    # Mulai dari huruf terakhir, lalu lanjut ke awal
    available_nahkoda = [alphabet[-1]] + alphabet[:-1]
    used_nahkoda = []

    # Dictionary untuk menyimpan kapan nakhoda terakhir bertugas
    nakhoda_terakhir_bertugas = {seamancode: None for seamancode in available_nahkoda}

    # Menentukan bulan awal dan bulan akhir untuk penugasan
    while month_index < len(bulan_list):
        month = bulan_list[month_index]
        print(f"--- Bulan: {month} ---")
        transaction = False  # **Tandai jika ada transaksi di bulan ini**

        # Jika semua nahkoda sudah digunakan, reset daftar
        if not available_nahkoda:
            print("Semua nahkoda sudah digunakan, mereset daftar")
            available_nahkoda = used_nahkoda
            used_nahkoda = []

        # **Penugasan nakhoda ke kapal secara bergantian tiap bulan**
        for i, kapal in enumerate(kapal_list):
            if (
                pd.isna(schedule.at[kapal, month]) and not transaction
            ):  # **Pastikan hanya ada 1 transaksi per bulan**
                if available_nahkoda:  # Jika masih ada nakhoda yang tersedia
                    nakhoda = available_nahkoda.pop(
                        0
                    )  # Ambil nakhoda pertama dari daftar
                    print(f"Menugaskan nakhoda {nakhoda} ke kapal {kapal}")

                    # **Assign nakhoda untuk `n` bulan ke depan**
                    for j in range(durasi_penugasan):
                        if month_index + j < len(bulan_list):
                            target_month = bulan_list[month_index + j]
                            schedule.at[kapal, target_month] = nakhoda

                    # Catat kapan nakhoda mulai bertugas
                    nakhoda_terakhir_bertugas[nakhoda] = month_index

                    # Pindahkan nakhoda ke daftar used setelah selesai masa tugasnya
                    used_nahkoda.append(nakhoda)

                    transaction = True  # **Tandai bahwa bulan ini sudah ada transaksi**
                    break  # **Hentikan loop setelah 1 nakhoda ditugaskan**

        # **Geser bulan setelah transaksi terjadi**
        if transaction:
            month_index += 1

    print(filtered_df_nahkoda)
    print("\nJadwal akhir:")

    pd.set_option("display.max_rows", None)  # Tampilkan semua baris
    pd.set_option("display.max_columns", None)  # Tampilkan semua kolom
    pd.set_option("display.width", 1000)  # Atur lebar tampilan
    schedule = schedule.reset_index().rename(columns={"index": "Ship"})
    # Tambahkan kolom tanggal rotasi pertama
    first_rotation_dates = []

    for idx, row in schedule.iterrows():
        first_date = ""
        for col in schedule.columns[1:]:  # Skip 'Ship' column
            if pd.notna(row[col]) and row[col] != "":
                # Format: 01/{Month} {Year} → konversi ke datetime
                try:
                    first_date = pd.to_datetime(f"01 {col}", format="%d %B %Y")
                    first_date = first_date.strftime("%d-%m-%Y")
                except Exception as e:
                    print(f"Error parsing date: {e}")
                    first_date = col  # fallback to text if parsing fails
                break
        first_rotation_dates.append(first_date)

    schedule["First Rotation Date"] = first_rotation_dates
    return schedule.fillna("")


def get_nahkoda(vessel_group_id_filter, new_nahkoda, type, part, quantity="ALL"):

    import pandas as pd

    # Load data
    local_df = pd.read_excel("../data/Data_Seamen_API.xlsx")

    if quantity != "ONE":
        filtered_df = filter_in_vessel(
            local_df, type, KELOMPOK
        )  # Ganti KELOMPOK sesuai konteksmu
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
            "%d/%m/%Y"
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

    # Tambah Index huruf
    alphabet = [chr(65 + i) for i in range(len(filtered_df_nahkoda))]
    filtered_df_nahkoda.insert(0, "Index", alphabet)

    # Pastikan kolom lengkap
    for col in ["name", "last_location", "seamancode", "start_date", "end_date"]:
        if col not in filtered_df_nahkoda.columns:
            filtered_df_nahkoda[col] = ""

    return filtered_df_nahkoda[
        ["Index", "name", "last_location", "seamancode", "start_date", "end_date"]
    ]
