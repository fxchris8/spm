import io
import os
import pathlib
from datetime import datetime

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from gensim.models import Word2Vec
from sklearn.metrics.pairwise import cosine_similarity

from database import get_mutations_as_data, get_seamen_as_data
from model import (
    filter_in_vessel,
    getRecommendation,
    search_candidate,
    vessel_group_id_deck,
)
from request_api import (
    get_kkm,
    get_masinisII,
    get_mualimI,
    get_nahkoda,
    get_nganggur,
    get_schedule,
)

app = Flask(__name__)
CORS(app=app)
app.secret_key = "supersecretkey"


# Route to check if the app is working
@app.route("/")
def index():
    return "Flask app is running!"


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

# Load data from Supabase instead of Excel
combined_df = get_seamen_as_data()

timestamp_file = "../last_request_time.txt"

# combined_df["DAY REMAINS DIFF"] = combined_df["day_remains"]
combined_df["DAY REMAINS DIFF"] = pd.to_numeric(
    combined_df["day_remains"], errors="coerce"
)

df_filtered = combined_df[combined_df["DAY REMAINS DIFF"] > 0][
    [
        "seamancode",
        "seafarercode",
        "name",
        "last_position",
        "last_location",
        "age",
        "certificate",
        "DAY REMAINS DIFF",
    ]
]

sorted_df = df_filtered.sort_values(by="DAY REMAINS DIFF")

sorted_df.to_csv("../data/sorted_seamen_data_diff.csv", index=False)

word2vec_model = None


def load_word2vec_model(model_path="word2vec_model.model"):
    """
    Memuat model Word2Vec.
    """
    global word2vec_model
    try:
        word2vec_model = Word2Vec.load(model_path)
        print("Word2Vec model loaded successfully. app py")
    except Exception as e:
        print(f"Error loading Word2Vec model: {e}")


# Panggil fungsi untuk memuat Word2Vec model saat aplikasi dimulai
load_word2vec_model("word2vec_model.model")


def get_last_request_time():
    if os.path.exists(timestamp_file):
        with open(timestamp_file, "r") as f:
            return datetime.fromisoformat(f.read().strip())
    return None


def save_last_request_time():
    with open(timestamp_file, "w") as f:
        f.write(datetime.now().isoformat())


def get_top_5_similar(target_seaman_code):
    try:
        global combined_df
        global word2vec_model

        if word2vec_model is None:
            print("Word2Vec model is None!")
            return jsonify({"error": "Word2Vec model belum dimuat"})

        target_seaman_data = combined_df[
            combined_df["seamancode"] == target_seaman_code
        ]

        if target_seaman_data.empty:
            print("No seaman found with that code")
            return jsonify(
                {"error": f"Seaman dengan kode {target_seaman_code} tidak ditemukan"}
            )

        rank = target_seaman_data.iloc[0]["last_position"]
        certificate = target_seaman_data.iloc[0]["certificate"]

        def get_word2vec_vector(text):
            if not isinstance(text, str):
                return np.zeros(word2vec_model.vector_size)
            words = str(text).split()
            try:
                word_vectors = [
                    word2vec_model.wv[word]
                    for word in words
                    if word in word2vec_model.wv
                ]
                if word_vectors:
                    return np.mean(word_vectors, axis=0)
                return np.zeros(word2vec_model.vector_size)
            except Exception as e:
                print(f"Error in get_word2vec_vector: {str(e)}")
                return np.zeros(word2vec_model.vector_size)

        user_input = f"{rank} {certificate}"
        user_vector = get_word2vec_vector(user_input)

        filtered_candidates = combined_df[
            combined_df["seamancode"] != target_seaman_code
        ].copy()

        filtered_candidates["vector"] = (
            filtered_candidates["last_position"].astype(str)
            + " "
            + filtered_candidates["certificate"].astype(str)
        )
        filtered_candidates["vector"] = filtered_candidates["vector"].apply(
            get_word2vec_vector
        )

        filtered_candidates["vector"] = filtered_candidates["vector"].apply(
            lambda x: x.tolist()
        )

        filtered_candidates["similarity"] = filtered_candidates["vector"].apply(
            lambda x: float(cosine_similarity([user_vector], [x])[0][0])
        )

        filtered_candidates = filtered_candidates.sort_values(
            by="similarity", ascending=False
        )
        top_5_recommendations = filtered_candidates.head(5)

        columns_to_drop = [
            "vector",
            "phone_number_1",
            "phone_number_2",
            "phone_number_3",
            "phone_number_4",
            "experience",
        ]
        top_5_recommendations = top_5_recommendations.drop(columns=columns_to_drop)

        top_5_dict = top_5_recommendations.to_dict(orient="records")

        for record in top_5_dict:
            for key, value in record.items():
                if "numpy" in str(type(value)):
                    if np.issubdtype(type(value), np.floating):
                        record[key] = float(value)
                    elif np.issubdtype(type(value), np.integer):
                        record[key] = int(value)
                    else:
                        record[key] = str(value)

        response = {"status": "success", "data": top_5_dict}

        return response

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# Route to serve the main dashboard
@app.route("/api/dashboard-data")
def get_dashboard_data():
    # Load from Supabase instead of Excel
    data = get_seamen_as_data()
    data = data.rename(
        columns={
            "age": "UMUR",
            "certificate": "CERTIFICATE",
            "day_remains": "DAY REMAINS",
            "last_position": "RANK",
            "last_location": "VESSEL",
            "name": "SEAMAN NAME",
            "seafarercode": "SEAFARER CODE",
            "seamancode": "SEAMAN CODE",
        }
    )

    data = data[
        [
            "SEAMAN CODE",
            "SEAFARER CODE",
            "SEAMAN NAME",
            "RANK",
            "VESSEL",
            "UMUR",
            "CERTIFICATE",
            "DAY REMAINS",
        ]
    ]

    # Kembalikan data sebagai JSON
    return data.to_json(orient="records")


# Route to get the top 5 similar seamen
@app.route("/similarity/<int:seaman_code>", methods=["GET"])
def get_similarity(seaman_code):
    top_5 = get_top_5_similar(seaman_code)
    print(f"Top 5 similar seamen for code {seaman_code}: {top_5}")
    return jsonify(top_5)


# Global variable to hold the current DataFrame
original_df = combined_df  # Asumsikan combined_df adalah DataFrame awal Anda


def generate_schedule(ship_names, first_assignments, start_year, end_year):
    months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ]
    # Calculate total months based on start and end year
    total_months = (end_year - start_year + 1) * 12

    # Generate headers for the schedule based on the range of years
    headers = []
    for i in range(total_months):
        month_name = months[i % 12]
        current_year = start_year + (i // 12)
        headers.append(f"{month_name} {current_year}")

    # Create the schedule DataFrame with ship names as index
    schedule = pd.DataFrame(columns=headers, index=ship_names)

    crew = [f"C{i+1}" for i in range(len(ship_names) + 1)]
    sorted_assignments = sorted(
        enumerate(first_assignments, start=1), key=lambda x: x[1]["month"]
    )

    for i, (ship_idx, assignment) in enumerate(sorted_assignments):
        start_month = (assignment["year"] - start_year) * 12 + assignment["month"] - 1
        # ship_name = ship_names[ship_idx - 1]
        crew_idx = i % len(crew)

        # Assign initial crew based on start month
        for j in range(len(ship_names)):
            current_month = (start_month + j) % total_months
            schedule.iloc[ship_idx - 1, current_month] = crew[crew_idx]

        # Assign transaction crew after initial period
        transaction_crew_idx = (crew_idx - 1) % len(crew)
        last_transaction_month = start_month

        for j in range(start_month + len(ship_names), total_months, len(ship_names)):
            current_month = j % total_months
            schedule.iloc[ship_idx - 1, current_month] = (
                f"{crew[transaction_crew_idx]} (transaction)"
            )

            # After each transaction, backfill NaN months between this and the previous transaction
            for k in range(last_transaction_month + 1, current_month):
                if pd.isna(schedule.iloc[ship_idx - 1, k]):
                    schedule.iloc[ship_idx - 1, k] = crew[crew_idx]

            last_transaction_month = current_month
            crew_idx = transaction_crew_idx
            transaction_crew_idx = (transaction_crew_idx - 1) % len(crew)

        # After the final transaction, fill the remaining NaN months
        for k in range(last_transaction_month + 1, total_months):
            if pd.isna(schedule.iloc[ship_idx - 1, k]):
                schedule.iloc[ship_idx - 1, k] = crew[crew_idx]

    return schedule


# kode 1
def prepare_display_df(df):
    display_df = df[
        ["SEAMAN CODE", "SEAMAN NAME", "VESSEL GROUP ID", "RANK", "CERTIFICATE"]
    ].copy()
    display_df.rename(columns={"UMUR": "AGE"}, inplace=True)
    return display_df


def prioritize_nakhoda_ant1(df):
    certificate_priority = {
        "ANT-I": 5,
        "ANT-II": 4,
        "ANT-III": 3,
        "ANT-IV": 2,
        "ANT-D": 1,
    }

    df["priority"] = df["CERTIFICATE"].map(certificate_priority).fillna(0)

    sorted_df = df.sort_values(by="priority", ascending=False).drop(
        columns=["priority"]
    )
    return sorted_df


def filter_group_1(df, group_id):
    filtered_df = df[df["VESSEL GROUP ID"] == group_id].copy()
    return filtered_df


# kode 2
def prepare_display_df2(df):
    display_df2 = df[
        ["SEAMAN CODE", "SEAMAN NAME", "VESSEL GROUP ID", "RANK", "CERTIFICATE"]
    ].copy()
    display_df2.rename(columns={"UMUR": "AGE"}, inplace=True)
    return display_df2


def prioritize_nakhoda_ant2(df):
    certificate_priority = {
        "ATT-I": 6,
        "ATT-II": 5,
        "ATT-III": 4,
        "ATT-IV": 3,
        "ATT-V": 2,
        "ATT-D": 1,
    }

    df["priority"] = df["CERTIFICATE"].map(certificate_priority).fillna(0)

    sorted_df2 = df.sort_values(by="priority", ascending=False).drop(
        columns=["priority"]
    )
    return sorted_df2


def filter_group_2(df, group_id):
    filtered_df2 = df[df["VESSEL GROUP ID"] == group_id].copy()
    return filtered_df2


def generate_crew_backup_pairs(ship_names, first_assignments):
    crew = [f"C{i+1}" for i in range(len(ship_names) + 1)]
    backup_pairs = []

    # Determine backup pairs based on first assignment and transaction logic
    for i in range(len(ship_names) + 1):
        main_crew = crew[i]  # Crew utama sesuai urutan
        backup_crew = crew[(i - 1) % len(crew)]  # Backup mengikuti aturan rotasi mundur

        # Mengatasi kasus rotasi C1 digantikan oleh C7
        if i == 0:
            backup_crew = crew[-1]  # C1 digantikan oleh C7

        backup_pairs.append({"main": main_crew, "backup": backup_crew})

    return backup_pairs


def color_map(val):
    """Mengembalikan style CSS berdasarkan nilai sel."""
    color_dict = {
        "A": "blue",
        "B": "red",
        "C": "green",
        "D": "orange",
        "E": "purple",
        "F": "brown",
        "G": "yellow",
        "H": "pink",
        "I": "cyan",
        "J": "magenta",
        "K": "lime",
        "L": "teal",
        "M": "indigo",
        "N": "gold",
        "O": "silver",
    }

    # Jika nilai sel ada di kamus, kembalikan background-color
    # Sekaligus atur warna tulisan (color) agar terlihat kontras
    if val in color_dict:
        return f"background-color: {color_dict[val]}; color: white;"
    else:
        # Jika nilai sel tidak ada di kamus, biarkan tanpa warna
        return ""


def df_to_json(df: pd.DataFrame):
    """
    Mengubah DataFrame menjadi struktur JSON:
    {
      "columns": [...],
      "data": [
        { "column1": value, "column2": value, ... },
        ...
      ]
    }
    """
    return {"columns": df.columns.tolist(), "data": df.to_dict(orient="records")}


@app.route("/api/container_rotation", methods=["POST"])
def container_rotation_api():
    try:
        # Ambil parameter 'job' dari query string
        job_raw = request.args.get("job", default="NAKHODA")

        # LOGGING untuk debugging
        print(f"[DEBUG] Query parameter 'job' yang diterima: '{job_raw}'")

        # Mapping konsisten
        job_mapping = {
            "NAKHODA": "NAKHODA",
            "KKM": "KKM",
            "MUALIMI": "MUALIM I",
            "MASINISII": "MASINIS II",
        }

        # Konversi ke uppercase dan validasi
        job_raw_upper = job_raw.upper()

        if job_raw_upper not in job_mapping:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Job '{job_raw}' tidak valid. Pilih antara: {', '.join(job_mapping.keys())}",
                    }
                ),
                400,
            )

        # Ambil nilai job dari mapping
        job = job_mapping[job_raw_upper]

        # LOGGING
        print(f"[DEBUG] Job setelah mapping: '{job}'")

        # Ambil data dari request body
        data = request.get_json()
        if not data:
            return jsonify({"error": "Tidak ada data yang diterima"}), 400

        required_fields = ["selected_group", "cadangan"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Field {field} diperlukan"}), 400

        # Ambil data dari payload
        selected_group = data["selected_group"]
        cadangan = data.get("cadangan", [])
        cadangan2 = data.get("cadangan2", [])
        type_vessel = data.get("type")
        part = data.get("part")

        # LOGGING
        print(f"[DEBUG] Memanggil get_schedule dengan job='{job}'")

        # Dapatkan DataFrame schedule dengan parameter job
        schedule_df = get_schedule(selected_group, cadangan, type_vessel, part, job)

        # PILIH FUNGSI YANG TEPAT BERDASARKAN JOB
        print(f"[DEBUG] Memanggil fungsi crew untuk job='{job}'")

        if job == "NAKHODA":
            crew_df = get_nahkoda(selected_group, cadangan, type_vessel, part)
        elif job == "KKM":
            crew_df = get_kkm(selected_group, cadangan, type_vessel, part)
        elif job == "MUALIM I":
            crew_df = get_mualimI(selected_group, cadangan, type_vessel, part)
        elif job == "MASINIS II":
            crew_df = get_masinisII(selected_group, cadangan, type_vessel, part)
        else:
            return jsonify({"error": f"Fungsi untuk job {job} belum tersedia"}), 400

        print(f"[DEBUG] Crew DataFrame shape: {crew_df.shape}")

        # Konversi ke JSON
        schedule_json = df_to_json(schedule_df)
        nahkoda_json = df_to_json(crew_df)  # ← Tetap pakai nama variable "nahkoda_json"

        # Jika ada cadangan2
        darat_json = None
        if cadangan2:
            print(f"[DEBUG] Memproses cadangan2 untuk job='{job}'")

            if job == "NAKHODA":
                darat_df = get_nahkoda(
                    selected_group, cadangan2, type_vessel, part, "ONE"
                )
            elif job == "KKM":
                darat_df = get_kkm(selected_group, cadangan2, type_vessel, part, "ONE")
            elif job == "MUALIM I":
                darat_df = get_mualimI(
                    selected_group, cadangan2, type_vessel, part, "ONE"
                )
            elif job == "MASINIS II":
                darat_df = get_masinisII(
                    selected_group, cadangan2, type_vessel, part, "ONE"
                )

            darat_json = df_to_json(darat_df)
            print(f"[DEBUG] Darat DataFrame shape: {darat_df.shape}")

        # RESPONSE - TETAP GUNAKAN KEY "nahkoda"
        print(f"[DEBUG] Mengirim response dengan job='{job}'")

        return jsonify(
            {
                "schedule": schedule_json,
                "nahkoda": nahkoda_json,  # ← KEY TETAP "nahkoda"
                "darat": darat_json,
            }
        )

    except Exception as e:
        app.logger.error(f"Error in container_rotation_api: {str(e)}", exc_info=True)
        print(f"[ERROR] Exception: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": "Terjadi kesalahan internal", "message": str(e)}), 500


@app.route("/api/get_cadangan_KKM")
def get_cadangan_KKM():
    df = get_nganggur("KKM")
    data = df.to_dict(orient="records")
    return jsonify(data)


@app.route("/api/get_cadangan_nakhoda")
def get_cadangan_nakhoda():
    df = get_nganggur("NAKHODA")
    data = df.to_dict(orient="records")
    return jsonify(data)


@app.route("/api/get_cadangan_mualimI")
def get_cadangan_mualimI():
    df = get_nganggur("MUALIM I")
    data = df.to_dict(orient="records")
    return jsonify(data)


@app.route("/api/get_cadangan_masinisII")
def get_cadangan_masinisII():
    df = get_nganggur("MASINIS II")
    data = df.to_dict(orient="records")
    return jsonify(data)


@app.route("/api/mutasi_filtered", methods=["GET"])
def get_mutasi_filtered():
    try:
        # Ambil parameter 'job' dari query string
        job_raw = request.args.get("job", default=None)

        job_mapping = {
            "NAKHODA": "NAKHODA",
            "KKM": "KKM",
            "MUALIMI": "MUALIM I",
            "MASINISII": "MASINIS II",
        }

        job = job_mapping.get(job_raw.upper() if job_raw else None)

        # Validasi job yang diterima
        if job not in ["NAKHODA", "KKM", "MUALIM I", "MASINIS II"]:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Job tidak valid. Pilih antara 'NAKHODA', 'KKM', 'MUALIM I' atau 'MASINIS II'.",
                    }
                ),
                400,
            )

        # Load from Supabase instead of Excel
        df_history = get_mutations_as_data()
        df_seamen = get_seamen_as_data()

        # Filter lokasi tertentu
        lokasi_filter = [
            "PENDING CUTI",
            "PENDING GAJI",
            "DARAT BIASA",
            "DARAT",
            "DARAT STAND-BY",
        ]

        # Ambil seamancode berdasarkan job
        seamancode_terfilter = df_seamen[
            (df_seamen["last_location"].isin(lokasi_filter))
            & (df_seamen["last_position"] == job)  # Menyesuaikan filter dengan job
        ]["seamancode"].unique()

        # Filter df_history berdasarkan seamancode
        df_mutasi_filtered = df_history[
            df_history["seamancode"].isin(seamancode_terfilter)
        ]

        # Merge untuk mendapatkan nama
        df_mutasi_filtered = df_mutasi_filtered.merge(
            df_seamen[["seamancode", "name"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Buat dictionary: seamancode -> {'name': ..., 'vessels': [...]} dengan vessels yang difilter
        mutasi_dict_filtered = (
            df_mutasi_filtered.groupby("seamancode")
            .apply(
                lambda g: {
                    "name": g["name"].iloc[0],
                    "vessels": g.loc[
                        ~g["fromvesselname"].isin(lokasi_filter), "fromvesselname"
                    ]
                    .dropna()
                    .unique()
                    .tolist(),
                }
            )
            .to_dict()
        )

        # Kirim response JSON
        return jsonify({"status": "success", "data": mutasi_dict_filtered})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/download_csv", methods=["POST"])
def download_csv():
    try:
        # Konversi HTML table yang dikirim menjadi DataFrame
        df_list = pd.read_html(request.form.get("schedule"))
        df = df_list[0]

        # Tulis DataFrame ke buffer in-memory dengan StringIO
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=True)

        # Konversi string CSV ke bytes menggunakan BytesIO
        csv_bytes = io.BytesIO(csv_buffer.getvalue().encode("utf-8"))
        csv_bytes.seek(0)

        # Kirim file CSV sebagai attachment
        return send_file(
            csv_bytes,
            mimetype="text/csv",
            as_attachment=True,
            download_name="schedule.csv",
        )
    except Exception as e:
        return f"An error occurred: {e}"


@app.route("/api/options", methods=["POST"])
def get_options():
    copy_df = original_df.copy()
    data = request.get_json()

    type_ = data.get("type")
    part = data.get("part")

    copy_df = filter_in_vessel(original_df, type_)
    if part:
        copy_df = vessel_group_id_deck(copy_df, type_, part)
    else:
        copy_df = vessel_group_id_deck(copy_df, type_)

    rank_order = [
        "NAKHODA",
        "MUALIM I",
        "MUALIM II",
        "MUALIM III",
        "KKM",
        "MASINIS I",
        "MASINIS II",
        "MASINIS III",
        "SERANG",
        "JURU MUDI",
        "ELECTRICIAN",
        "MANDOR MESIN",
        "JURU MINYAK",
        "JURU MASAK I",
        "KADET DEK",
        "KADET MESIN",
        "EXTRA KKM",
        "KADET ELECTRONIC",
        "EXT. MUALIM I",
    ]

    cert_order = [
        "ANT-I",
        "ANT-II",
        "ANT-III",
        "ANT-IV",
        "ANT-V",
        "ANT-D",
        "ATT-I",
        "ATT-II",
        "ATT-III",
        "ATT-IV",
        "ATT-V",
        "ATT-D",
        "BASIC SAFETY TRAINING",
        "ETO",
    ]

    # Pilihan untuk setiap kolom
    bagian_option = (
        copy_df["BAGIAN"].unique().tolist() if "BAGIAN" in copy_df.columns else []
    )
    cert_option = (
        copy_df["certificate"].unique().tolist()
        if "certificate" in copy_df.columns
        else []
    )
    rank_option = (
        copy_df["last_position"].unique().tolist()
        if "last_position" in copy_df.columns
        else []
    )
    vessel_option = (
        copy_df["last_location"].unique().tolist()
        if "last_location" in copy_df.columns
        else []
    )

    # Urutkan rank_option berdasarkan rank_order
    rank_option = sorted(
        rank_option,
        key=lambda x: rank_order.index(x) if x in rank_order else len(rank_order),
    )

    # Urutkan cert_option berdasarkan cert_order
    cert_option = sorted(
        cert_option,
        key=lambda x: cert_order.index(x) if x in cert_order else len(cert_order),
    )

    data = {
        "bagian_option": bagian_option,
        "cert_option": cert_option,
        "rank_option": rank_option,
        "vessel_option": vessel_option,
    }
    return jsonify(data)


@app.route("/get-recommendation", methods=["POST"])
def get_recommendation():
    data_candidate = request.json
    bagian = data_candidate["BAGIAN"]
    vessel_name = data_candidate["VESSEL"]
    rank = data_candidate["RANK"]
    certificate = data_candidate["CERTIFICATE"]
    age_range = (data_candidate["UMUR"], data_candidate["UMUR"])

    # Panggil getRecommendation dengan original_df sebagai parameter
    recommendations = getRecommendation(
        original_df, data_candidate, bagian, vessel_name, rank, certificate, age_range
    )
    result = recommendations.to_dict(orient="records")
    return jsonify(result)


@app.route("/api/get-manual-search", methods=["POST"])
def get_manual_search():
    copy_df = original_df.copy()
    data_candidate = request.json

    type_ = data_candidate["TYPE"]
    part = data_candidate["PART"]

    copy_df = filter_in_vessel(original_df, type_)
    if part:
        copy_df = vessel_group_id_deck(copy_df, type_, part)
    else:
        copy_df = vessel_group_id_deck(copy_df, type_)

    bagian = data_candidate["BAGIAN"]
    vessel_name = data_candidate["VESSEL"]
    age_range = (int(data_candidate["LB"]), int(data_candidate["UB"]))

    print("DATA: ", data_candidate)

    # Call search_candidate with original_df as the parameter
    filtered_candidates = search_candidate(copy_df, bagian, vessel_name, age_range)
    print("THIS IS VESSEL GROUP ID", filtered_candidates["VESSEL GROUP ID"])

    if filtered_candidates.empty:
        return jsonify([])
    print("DATAFRAME COLUMNS:", copy_df.columns)

    recommendations = getRecommendation(
        copy_df,
        data_candidate,
        bagian,
        vessel_name,
        data_candidate["RANK"],
        data_candidate["CERTIFICATE"],
        age_range,
    )

    # Ensure PHONE1, PHONE2, PHONE3, and PHONE4 are included in the response
    result = recommendations[
        [
            "seamancode",
            "seafarercode",
            "name",
            "last_position",
            "last_location",
            "age",
            "certificate",
            "phone_number_1",
            "phone_number_2",
            "phone_number_3",
            "phone_number_4",
            "day_remains",
        ]
    ].to_dict(orient="records")

    return jsonify(result)


@app.route("/api/seamen/promotion_candidates", methods=["GET"])
def get_promotion_candidates():
    try:
        from datetime import datetime, timedelta, timezone

        # Load from Supabase instead of Excel
        df_history = get_mutations_as_data()
        df_seamen = get_seamen_as_data()

        # Tanggal cutoff pengalaman 2 tahun
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=2 * 365)

        # Filter seamen berdasarkan posisi dan sertifikat
        seamancode_terfilter = df_seamen[
            (df_seamen["last_position"] == "MUALIM I")
            & (df_seamen["certificate"] == "ANT-I")
        ]["seamancode"].unique()

        # Filter df_history untuk pengalaman lebih dari 2 tahun
        df_mutasi_filtered = df_history[
            (df_history["seamancode"].isin(seamancode_terfilter))
            & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
        ]

        # Merge untuk ambil nama
        df_mutasi_filtered = df_mutasi_filtered.merge(
            df_seamen[["seamancode", "name", "last_position"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Group jadi dict dan hilangkan history yang tidak relevan
        result = (
            df_mutasi_filtered.groupby("seamancode")
            .apply(
                lambda g: {
                    "code": int(g["seamancode"].iloc[0]),
                    "name": g["name"].iloc[0],
                    "rank": g["last_position"].iloc[0],
                    "history": g[
                        ~g["fromvesselname"].isin(["PENDING GAJI", "PENDING CUTI"])
                    ]["fromvesselname"]
                    .dropna()
                    .unique()
                    .tolist(),
                }
            )
            .tolist()
        )

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/seamen/promotion_candidates_kkm", methods=["GET"])
def get_promotion_candidates_kkm():
    try:
        from datetime import datetime, timedelta, timezone

        # Load from Supabase instead of Excel
        df_history = get_mutations_as_data()
        df_seamen = get_seamen_as_data()

        # Tanggal cutoff pengalaman 2 tahun
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=4 * 365)

        # Filter seamen berdasarkan posisi
        seamancode_terfilter = df_seamen[(df_seamen["last_position"] == "MASINIS II")][
            "seamancode"
        ].unique()

        # Filter df_history untuk pengalaman lebih dari 2 tahun
        df_mutasi_filtered = df_history[
            (df_history["seamancode"].isin(seamancode_terfilter))
            & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
        ]

        # Daftar kapal yang disyaratkan
        kapal_disyaratkan = {
            "KM. HIJAU SEJUK",
            "KM. ORIENTAL DIAMOND",
            "KM. ORIENTAL RUBY",
            "KM. ORIENTAL JADE",
            "KM. VERIZON",
            "KM. SPIL HANA",
            "KM. SPIL HAPSRI",
            "KM. SPIL HAYU",
            "KM. SPIL HASYA",
            "KM. HIJAU JELITA",
            "KM. HIJAU SAMUDERA",
            "KM. ORIENTAL GOLD",
            "KM. ORIENTAL GALAXY",
            "KM. LUZON",
            "KM. ARMADA PERMATA",
            "KM. ORIENTAL SILVER",
            "KM. ORIENTAL EMERALD",
        }

        # Hitung jumlah kapal unik dari daftar di atas yang pernah disinggahi oleh tiap seamancode
        df_kapal = df_mutasi_filtered.copy()
        df_kapal["kapal_terkait"] = df_kapal["fromvesselname"].where(
            df_kapal["fromvesselname"].isin(kapal_disyaratkan), None
        )
        df_kapal.loc[
            df_kapal["tovesselname"].isin(kapal_disyaratkan), "kapal_terkait"
        ] = df_kapal["tovesselname"]

        # Ambil hanya yang punya >= 2 kapal unik dari daftar
        df_kapal_valid = (
            df_kapal.dropna(subset=["kapal_terkait"])
            .groupby("seamancode")["kapal_terkait"]
            .nunique()
            .reset_index()
        )
        df_kapal_valid = df_kapal_valid[df_kapal_valid["kapal_terkait"] >= 2]

        # Filter df_mutasi_filtered berdasarkan hasil di atas
        df_mutasi_filtered = df_mutasi_filtered[
            df_mutasi_filtered["seamancode"].isin(df_kapal_valid["seamancode"])
        ]

        # Merge untuk ambil nama
        df_mutasi_filtered = df_mutasi_filtered.merge(
            df_seamen[["seamancode", "name", "last_position"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Group jadi dict
        result = (
            df_mutasi_filtered.groupby("seamancode")
            .apply(
                lambda g: {
                    "code": int(g["seamancode"].iloc[0]),
                    "name": g["name"].iloc[0],
                    "rank": g["last_position"].iloc[0],
                    "history": g["fromvesselname"].dropna().unique().tolist(),
                }
            )
            .tolist()
        )

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/seamen/promotion_candidates_mualimI", methods=["GET"])
def get_promotion_candidates_mualimI():
    try:
        from datetime import datetime, timedelta, timezone

        # Load from Supabase instead of Excel
        df_history = get_mutations_as_data()
        df_seamen = get_seamen_as_data()

        # Tanggal cutoff pengalaman 2 tahun
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=2 * 365)

        # Filter seamen berdasarkan posisi dan sertifikat (sertifikat mualin 2 itu apa?)
        seamancode_terfilter = df_seamen[
            (df_seamen["last_position"] == "MUALIM II")
            & (df_seamen["certificate"] == "ANT-I")
        ]["seamancode"].unique()

        # Filter df_history untuk pengalaman lebih dari 2 tahun
        df_mutasi_filtered = df_history[
            (df_history["seamancode"].isin(seamancode_terfilter))
            & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
        ]

        # Merge untuk ambil nama
        df_mutasi_filtered = df_mutasi_filtered.merge(
            df_seamen[["seamancode", "name", "last_position"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Group jadi dict dan hilangkan history yang tidak relevan
        result = (
            df_mutasi_filtered.groupby("seamancode")
            .apply(
                lambda g: {
                    "code": int(g["seamancode"].iloc[0]),
                    "name": g["name"].iloc[0],
                    "rank": g["last_position"].iloc[0],
                    "history": g[
                        ~g["fromvesselname"].isin(["PENDING GAJI", "PENDING CUTI"])
                    ]["fromvesselname"]
                    .dropna()
                    .unique()
                    .tolist(),
                }
            )
            .tolist()
        )

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/seamen/promotion_candidates_masinisII", methods=["GET"])
def get_promotion_candidates_masinisII():
    try:
        from datetime import datetime, timedelta, timezone

        # Load from Supabase instead of Excel
        df_history = get_mutations_as_data()
        df_seamen = get_seamen_as_data()

        # Tanggal cutoff pengalaman 2 tahun
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=4 * 365)

        # Filter seamen berdasarkan posisi
        seamancode_terfilter = df_seamen[(df_seamen["last_position"] == "MASINIS III")][
            "seamancode"
        ].unique()

        # Filter df_history untuk pengalaman lebih dari 2 tahun
        df_mutasi_filtered = df_history[
            (df_history["seamancode"].isin(seamancode_terfilter))
            & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
        ]

        # Daftar kapal yang disyaratkan
        kapal_disyaratkan = {
            "KM. HIJAU SEJUK",
            "KM. ORIENTAL DIAMOND",
            "KM. ORIENTAL RUBY",
            "KM. ORIENTAL JADE",
            "KM. VERIZON",
            "KM. SPIL HANA",
            "KM. SPIL HAPSRI",
            "KM. SPIL HAYU",
            "KM. SPIL HASYA",
            "KM. HIJAU JELITA",
            "KM. HIJAU SAMUDERA",
            "KM. ORIENTAL GOLD",
            "KM. ORIENTAL GALAXY",
            "KM. LUZON",
            "KM. ARMADA PERMATA",
            "KM. ORIENTAL SILVER",
            "KM. ORIENTAL EMERALD",
        }

        # Hitung jumlah kapal unik dari daftar di atas yang pernah disinggahi oleh tiap seamancode
        df_kapal = df_mutasi_filtered.copy()
        df_kapal["kapal_terkait"] = df_kapal["fromvesselname"].where(
            df_kapal["fromvesselname"].isin(kapal_disyaratkan), None
        )
        df_kapal.loc[
            df_kapal["tovesselname"].isin(kapal_disyaratkan), "kapal_terkait"
        ] = df_kapal["tovesselname"]

        # Ambil hanya yang punya >= 2 kapal unik dari daftar
        df_kapal_valid = (
            df_kapal.dropna(subset=["kapal_terkait"])
            .groupby("seamancode")["kapal_terkait"]
            .nunique()
            .reset_index()
        )
        df_kapal_valid = df_kapal_valid[df_kapal_valid["kapal_terkait"] >= 2]

        # Filter df_mutasi_filtered berdasarkan hasil di atas
        df_mutasi_filtered = df_mutasi_filtered[
            df_mutasi_filtered["seamancode"].isin(df_kapal_valid["seamancode"])
        ]

        # Merge untuk ambil nama
        df_mutasi_filtered = df_mutasi_filtered.merge(
            df_seamen[["seamancode", "name", "last_position"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Group jadi dict
        result = (
            df_mutasi_filtered.groupby("seamancode")
            .apply(
                lambda g: {
                    "code": int(g["seamancode"].iloc[0]),
                    "name": g["name"].iloc[0],
                    "rank": g["last_position"].iloc[0],
                    "history": g["fromvesselname"].dropna().unique().tolist(),
                }
            )
            .tolist()
        )

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/save-excel", methods=["POST"])
def save_excel():
    data = request.get_json()
    try:
        df = pd.DataFrame(data)

        # Tentukan root project (folder spm-react-main)
        base_dir = pathlib.Path(
            __file__
        ).parent.parent.resolve()  # ke dua tingkat atas dari app.py
        data_dir = base_dir / "data"

        # Buat folder data jika belum ada
        data_dir.mkdir(parents=True, exist_ok=True)

        save_path = data_dir / "seaman_selected.xlsx"
        df.to_excel(save_path, index=False)

        return jsonify({"status": "success", "message": "File berhasil disimpan!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Kode lama, pake Excel
# @app.route("/api/filter_history", methods=["GET"])
# def filter_history():
#     file_path = "../data/seaman_selected.xlsx"

#     allowed_status = [
#         "PENDING CUTI",
#         "PENDING GAJI",
#         "DARAT BIASA",
#         "DARAT",
#         "DARAT STAND-BY",
#     ]

#     try:
#         df = pd.read_excel(file_path)

#         # Cek kolom wajib
#         if "history" not in df.columns or "code" not in df.columns:
#             return (
#                 jsonify(
#                     {
#                         "status": "error",
#                         "message": "Kolom 'history' atau 'code' tidak ditemukan.",
#                     }
#                 ),
#                 400,
#             )

#         # Ambil parameter group kapal dari frontend, multiple ?group=xxx&group=yyy
#         group_vessels = request.args.getlist("group")

#         result = []

#         for _, row in df.iterrows():
#             history_str = str(row.get("history", ""))

#             # Split kapal dari history (pisah koma, trim spasi)
#             history_vessels = [v.strip() for v in history_str.split(",") if v.strip()]

#             # Hitung match kapal yang ada di group_vessels dan history_vessels
#             match_count = sum(1 for v in history_vessels if v in group_vessels)

#             # Buang kata-kata allowed_status dari history_str supaya tidak tampil di tabel
#             filtered_history = history_str
#             for status in allowed_status:
#                 filtered_history = filtered_history.replace(status, "")
#             # Hilangkan koma ekstra dan spasi berlebih setelah penghapusan kata status
#             filtered_history = ",".join(
#                 [v.strip() for v in filtered_history.split(",") if v.strip()]
#             )

#             result.append(
#                 {
#                     "seamancode": row.get("code", ""),
#                     "name": row.get("name", ""),
#                     "history": filtered_history,
#                     "matchCount": match_count,
#                 }
#             )

#         return jsonify({"status": "success", "data": result, "count": len(result)})

#     except Exception as e:
#         return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/filter_history", methods=["GET"])
def filter_history():
    allowed_status = [
        "PENDING CUTI",
        "PENDING GAJI",
        "DARAT BIASA",
        "DARAT",
        "DARAT STAND-BY",
    ]

    try:
        # Ganti Excel dengan fetch dari database
        df_history = get_mutations_as_data()  # Ini fungsi yang sudah ada
        df_seamen = get_seamen_as_data()  # Untuk ambil nama

        # Merge untuk dapat nama
        df = df_history.merge(
            df_seamen[["seamancode", "name"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Cek kolom wajib - sesuaikan dengan struktur data Anda
        if "seamancode" not in df.columns:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Kolom 'seamancode' tidak ditemukan.",
                    }
                ),
                400,
            )

        # Ambil parameter group kapal dari frontend
        group_vessels = request.args.getlist("group")

        # Group by seamancode untuk gabungkan history
        grouped = (
            df.groupby("seamancode")
            .agg(
                {
                    "name": "first",
                    "fromvesselname": lambda x: x.dropna().tolist(),  # Collect all vessels
                }
            )
            .reset_index()
        )

        result = []

        for _, row in grouped.iterrows():
            history_vessels = row.get("fromvesselname", [])

            # Filter allowed_status dari history
            filtered_vessels = [v for v in history_vessels if v not in allowed_status]

            # Hitung match dengan group
            match_count = sum(1 for v in filtered_vessels if v in group_vessels)

            # Join jadi string
            history_str = ", ".join(filtered_vessels)

            # Lihat last location
            last_location = df_seamen[df_seamen["seamancode"] == row["seamancode"]][
                "last_location"
            ].values

            result.append(
                {
                    "seamancode": row.get("seamancode", ""),
                    "name": row.get("name", ""),
                    "history": history_str,
                    "matchCount": match_count,
                    "last_location": last_location[0] if len(last_location) > 0 else "",
                }
            )

        return jsonify({"status": "success", "data": result, "count": len(result)})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    port = 8048
    host = "0.0.0.0"
    print(f"Flask app running on port {port}")

    app.run(debug=True, port=port, host=host)
