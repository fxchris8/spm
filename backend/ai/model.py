from datetime import datetime

import numpy as np
import pandas as pd
from gensim.models import Word2Vec
from sklearn.metrics.pairwise import cosine_similarity

# Memuat model Word2Vec secara global
word2vec_model = None


def load_word2vec_model(model_path=None):
    """
    Memuat model Word2Vec.
    """
    global word2vec_model
    import os

    if model_path is None:
        # Use absolute path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "word2vec_model.model")

    try:
        word2vec_model = Word2Vec.load(model_path)
        print(f"Word2Vec model loaded successfully from: {model_path}")
    except Exception as e:
        print(f"Error loading Word2Vec model: {e}")
        word2vec_model = None


# Fungsi untuk mendapatkan Vessel Group ID berdasarkan nama vessel
def get_vessel_group_id(df, vessel_name):

    vessel_row = df[df["last_location"] == vessel_name]

    # print("vessel row hasil", vessel_row)
    if not vessel_row.empty:
        return vessel_row.iloc[0]["VESSEL GROUP ID"]
    else:
        return None


# Helper function to calculate the difference between 'day_remains' and today
def calculate_day_remains_difference(df):
    # Convert the 'DAY REMAINS' column to datetime, handling errors
    df["day_remains"] = pd.to_datetime(
        df["day_remains"], format="%Y-%m-%d", errors="coerce"
    )

    # Filter out rows where 'DAY REMAINS' couldn't be converted to a date
    df = df[df["day_remains"].notna()]

    # Calculate the difference in days
    today = datetime.now().date()
    df["day_remains"] = (df["day_remains"].dt.date - today).apply(
        lambda x: x.days if pd.notna(x) else None
    )

    return df


def getRecommendation(
    df, dataCandidates, bagian, vessel_name, rank, certificate, age_range
):
    global word2vec_model

    if word2vec_model is None:
        load_word2vec_model()

    # Inisialisasi filtered_df
    filtered_df = df.copy()
    # print("INI VESSEL NAMEEEEEEEEEE", vessel_name)
    vessel_group_id = get_vessel_group_id(filtered_df, vessel_name)
    filtered_df = filtered_df[(df["VESSEL GROUP ID"] == vessel_group_id)]

    # Memfilter berdasarkan umur
    filtered_df = filtered_df[
        (filtered_df["age"] >= age_range[0]) & (filtered_df["age"] <= age_range[1])
    ].copy()
    # print(filtered_df)

    # Menggabungkan fitur RANK dan CERTIFICATE untuk perhitungan similarity
    filtered_df["combined_features"] = (
        filtered_df["last_position"] + " " + filtered_df["certificate"]
    )

    # Fungsi untuk mengubah teks menjadi vektor Word2Vec
    def get_word2vec_vector(text):
        # Check if model is loaded
        if word2vec_model is None:
            # Load model if not already loaded
            load_word2vec_model()
            if word2vec_model is None:
                # Return zero vector with default size if model still can't be loaded
                return np.zeros(100)

        words = text.split()
        word_vectors = [
            word2vec_model.wv[word] for word in words if word in word2vec_model.wv
        ]
        if word_vectors:
            return np.mean(word_vectors, axis=0)  # Rata-rata vektor kata
        else:
            return np.zeros(
                word2vec_model.vector_size
            )  # Vektor nol jika kata tidak ditemukan

    # Mengonversi semua data CERTIFICATE menjadi vektor Word2Vec
    filtered_df["vector"] = filtered_df["combined_features"].apply(get_word2vec_vector)

    # Membuat vektor dari input pengguna
    user_input = rank + " " + certificate
    user_vector = get_word2vec_vector(user_input)

    # Menghitung cosine similarity antara input pengguna dan data
    similarity_scores = filtered_df["vector"].apply(
        lambda x: cosine_similarity([user_vector], [x])[0][0]
    )

    # Hierarchical mapping
    hierarchy_mapping = {
        "ANT": ["ANT-I", "ANT-II", "ANT-III", "ANT-IV", "ANT-V", "ANT-D"],
        "ATT": ["ATT-I", "ATT-II", "ATT-III", "ATT-IV", "ATT-V", "ATT-D"],
    }

    # Fungsi untuk menghitung skor hierarchical similarity
    def get_hierarchy_score(cert1, cert2):
        for group in hierarchy_mapping.values():
            if cert1 in group and cert2 in group:
                idx1, idx2 = group.index(cert1), group.index(cert2)
                return 1 - abs(idx1 - idx2) / len(
                    group
                )  # Skor berdasarkan jarak hierarki
        return 0  # Jika tidak ada di mapping, beri skor 0

    # Penanganan untuk sertifikat non-hierarki
    def handle_non_hierarchical_certificate(cert):
        # non_hierarchical_certificates = ["ETO", "BASIC SAFETY TRAINING"]
        if cert == "ETO":
            return 1  # Skor tinggi untuk ETO
        elif cert == "BASIC SAFETY TRAINING":
            return 0.5  # Skor lebih rendah untuk Basic Safety Training
        return 0  # Skor 0 jika tidak ada dalam daftar non-hierarchical

    # Tambahkan prioritas untuk RANK yang sesuai
    filtered_df["rank_match"] = filtered_df["last_position"].apply(
        lambda r: 1 if r == rank else 0
    )

    # Menambahkan skor hierarchical similarity
    filtered_df["hierarchical_score"] = filtered_df["certificate"].apply(
        lambda cert: get_hierarchy_score(certificate, cert)
    )

    filtered_df["non_hierarchical_score"] = filtered_df["certificate"].apply(
        handle_non_hierarchical_certificate
    )

    # Menambahkan similarity score ke data dan mengurutkan berdasarkan score
    filtered_df["similarity_score"] = similarity_scores

    # Menggabungkan skor Word2Vec, hierarchical similarity, dan non-hierarchical score
    filtered_df["final_score"] = (
        (0.4 * filtered_df["similarity_score"])
        + (0.2 * filtered_df["rank_match"])
        + (0.3 * filtered_df["hierarchical_score"])
        + (0.1 * filtered_df["non_hierarchical_score"])
    )

    # Sorting berlapis: Prioritas pada rank_match lalu final_score
    filtered_df = filtered_df.sort_values(
        by=["rank_match", "final_score"], ascending=[False, False]
    )

    # Mengambil top 20 rekomendasi
    recommendations = filtered_df.head(20)[
        [
            "seamancode",
            "seafarercode",
            "name",
            "last_position",
            "last_location",
            "VESSEL GROUP ID",
            "age",
            "certificate",
            "similarity_score",
            "phone_number_1",
            "phone_number_2",
            "phone_number_3",
            "phone_number_4",
            "day_remains",
        ]
    ]

    return recommendations


def search_candidate(df, bagian, vessel_name, age_range):
    # Periksa apakah 'VESSEL GROUP ID' ada di DataFrame
    if "VESSEL GROUP ID" in df.columns:
        vessel_group_id = get_vessel_group_id(df, vessel_name)
        # print("bagian ", bagian)
        # print("vessel group id ", vessel_group_id)
        # print("age 0 ", age_range[0])
        # print("age 1 ", age_range[1])

        if vessel_group_id is None:
            # Return empty DataFrame with VESSEL GROUP ID column to prevent KeyError
            empty_df = pd.DataFrame(columns=df.columns)
            return empty_df

        # Memfilter data berdasarkan BAGIAN, VESSEL GROUP ID, dan umur
        filtered_data = df[
            (df["VESSEL GROUP ID"] == vessel_group_id)
            & (df["age"] >= age_range[0])
            & (df["age"] <= age_range[1])
        ]
    else:
        # Jika 'VESSEL GROUP ID' tidak ada, hanya filter berdasarkan BAGIAN dan umur
        filtered_data = df[(df["age"] >= age_range[0]) & (df["age"] <= age_range[1])]

    return filtered_data


def filter_in_vessel(dataframe, group_name, kelompok=None):
    if kelompok is None:
        from repositories.vessel_repository import build_kelompok
        kelompok = build_kelompok()

    if group_name not in kelompok:
        raise ValueError(f"Group '{group_name}' tidak ditemukan dalam kelompok.")

    vessel_list = kelompok[group_name]
    filtered_df = dataframe[dataframe["last_location"].isin(vessel_list)]
    return filtered_df


def vessel_group_id_deck(dataframe, vessel, type=None):
    """
    Menambahkan kolom 'VESSEL GROUP ID' ke dalam DataFrame berdasarkan konfigurasi
    dari database (vessel management).

    Group ID diformat sebagai {prefix}{nomor}, contoh: D1, D2, E1, F1, G2, dst.
    Prefix diambil dari field 'vessel' di DB:
        container + deck   → 'D'
        container + engine → 'E'
        manalagi  + deck   → 'F'
        manalagi  + engine → 'G'

    Parameters:
        dataframe (pd.DataFrame): DataFrame input dengan kolom 'last_location'.
        vessel (str): Kategorisasi kapal, e.g. 'container', 'manalagi'.
        type (str): Jenis pengelompokan, 'deck' atau 'engine'.

    Returns:
        pd.DataFrame: DataFrame dengan kolom tambahan 'VESSEL GROUP ID'.
    """
    from repositories.vessel_repository import get_vessel_config_from_db

    # Hanya container dan manalagi yang memiliki grup rotasi di DB
    if vessel not in ["container", "manalagi"]:
        dataframe = dataframe.copy()
        dataframe["VESSEL GROUP ID"] = "1"
        return dataframe

    if type not in ["deck", "engine"]:
        raise ValueError("Parameter 'type' harus bernilai 'deck' atau 'engine'")

    prefix, groups = get_vessel_config_from_db(vessel, type)

    if not groups:
        dataframe = dataframe.copy()
        dataframe["VESSEL GROUP ID"] = "UNKNOWN"
        return dataframe

    # Buat mapping nama kapal → VESSEL GROUP ID
    vessel_to_group = {}
    for idx, (_, ships) in enumerate(groups.items(), start=1):
        group_id = f"{prefix}{idx}"
        for ship in ships:
            vessel_to_group[ship] = group_id

    dataframe = dataframe.copy()
    dataframe["VESSEL GROUP ID"] = (
        dataframe["last_location"].map(vessel_to_group).fillna("UNKNOWN")
    )

    # Sisipkan kolom 'VESSEL GROUP ID' tepat setelah 'last_location'
    cols = dataframe.columns.tolist()
    vessel_idx = cols.index("last_location")
    cols.insert(vessel_idx + 1, cols.pop(cols.index("VESSEL GROUP ID")))
    dataframe = dataframe[cols]

    return dataframe


# Load the Word2Vec model when the module is imported
load_word2vec_model()
