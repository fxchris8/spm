"""
Module ini berisi fungsi-fungsi untuk merekomendasikan dan mencari kandidat pelaut (seafarer)
menggunakan model Word2Vec. Kemiripan antara kandidat dan kebutuhan kapal dihitung
berbasis cosine similarity, skor hierarki sertifikat, dan kesesuaian jabatan.
"""

import re
from datetime import datetime

import numpy as np
import pandas as pd
from gensim.models import Word2Vec
from sklearn.metrics.pairwise import cosine_similarity

word2vec_model = None


def load_word2vec_model(model_path=None):
    """
    Memuat model Word2Vec.
    """
    global word2vec_model
    import os

    if model_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "word2vec_model.model")

    try:
        word2vec_model = Word2Vec.load(model_path)
        print(f"Word2Vec model loaded successfully from: {model_path}")
    except Exception as e:
        print(f"Error loading Word2Vec model: {e}")
        word2vec_model = None


def get_vessel_group_id(df, vessel_name):
    """
    Mengembalikan VESSEL GROUP ID dari DataFrame berdasarkan nama vessel.
    Mengembalikan None jika vessel tidak ditemukan.
    """
    vessel_row = df[df["last_location"] == vessel_name]

    if not vessel_row.empty:
        return vessel_row.iloc[0]["VESSEL GROUP ID"]
    else:
        return None


def calculate_day_remains_difference(df):
    """
    Mengonversi kolom 'day_remains' menjadi selisih hari dari tanggal hari ini.
    Baris yang tidak memiliki tanggal valid akan dihapus.
    """
    df["day_remains"] = pd.to_datetime(
        df["day_remains"], format="%Y-%m-%d", errors="coerce"
    )

    df = df[df["day_remains"].notna()]

    today = datetime.now().date()
    df["day_remains"] = (df["day_remains"].dt.date - today).apply(
        lambda x: x.days if pd.notna(x) else None
    )

    return df


def getRecommendation(
    df, dataCandidates, bagian, vessel_name, rank, certificate, age_range
):
    """
    Menghasilkan rekomendasi top-20 kandidat pelaut berdasarkan vessel, jabatan,
    sertifikat, dan rentang usia menggunakan kombinasi cosine similarity Word2Vec,
    skor hierarki sertifikat, dan kesesuaian jabatan.
    """
    global word2vec_model

    if word2vec_model is None:
        load_word2vec_model()

    filtered_df = df.copy()
    vessel_group_id = get_vessel_group_id(filtered_df, vessel_name)
    filtered_df = filtered_df[(df["VESSEL GROUP ID"] == vessel_group_id)]

    filtered_df = filtered_df[
        (filtered_df["age"] >= age_range[0]) & (filtered_df["age"] <= age_range[1])
    ].copy()

    filtered_df["combined_features"] = (
        filtered_df["last_position"] + " " + filtered_df["certificate"]
    )

    def get_word2vec_vector(text):
        if word2vec_model is None:
            load_word2vec_model()
            if word2vec_model is None:
                return np.zeros(100)

        words = text.split()
        word_vectors = [
            word2vec_model.wv[word] for word in words if word in word2vec_model.wv
        ]
        if word_vectors:
            return np.mean(word_vectors, axis=0)
        else:
            return np.zeros(word2vec_model.vector_size)

    filtered_df["vector"] = filtered_df["combined_features"].apply(get_word2vec_vector)

    user_input = rank + " " + certificate
    user_vector = get_word2vec_vector(user_input)

    similarity_scores = filtered_df["vector"].apply(
        lambda x: cosine_similarity([user_vector], [x])[0][0]
    )

    hierarchy_mapping = {
        "ANT": ["ANT-I", "ANT-II", "ANT-III", "ANT-IV", "ANT-V", "ANT-D"],
        "ATT": ["ATT-I", "ATT-II", "ATT-III", "ATT-IV", "ATT-V", "ATT-D"],
    }

    def get_hierarchy_score(cert1, cert2):
        for group in hierarchy_mapping.values():
            if cert1 in group and cert2 in group:
                idx1, idx2 = group.index(cert1), group.index(cert2)
                return 1 - abs(idx1 - idx2) / len(group)
        return 0

    def handle_non_hierarchical_certificate(cert):
        if cert == "ETO":
            return 1
        elif cert == "BASIC SAFETY TRAINING":
            return 0.5
        return 0

    filtered_df["rank_match"] = filtered_df["last_position"].apply(
        lambda r: 1 if r == rank else 0
    )

    filtered_df["hierarchical_score"] = filtered_df["certificate"].apply(
        lambda cert: get_hierarchy_score(certificate, cert)
    )

    filtered_df["non_hierarchical_score"] = filtered_df["certificate"].apply(
        handle_non_hierarchical_certificate
    )

    filtered_df["similarity_score"] = similarity_scores

    filtered_df["final_score"] = (
        (0.4 * filtered_df["similarity_score"])
        + (0.2 * filtered_df["rank_match"])
        + (0.3 * filtered_df["hierarchical_score"])
        + (0.1 * filtered_df["non_hierarchical_score"])
    )

    filtered_df = filtered_df.sort_values(
        by=["rank_match", "final_score"], ascending=[False, False]
    )

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
    """
    Memfilter kandidat pelaut berdasarkan vessel group dan rentang usia.
    Jika kolom 'VESSEL GROUP ID' tidak tersedia, filter hanya berdasarkan usia.
    """
    if "VESSEL GROUP ID" in df.columns:
        vessel_group_id = get_vessel_group_id(df, vessel_name)

        if vessel_group_id is None:
            empty_df = pd.DataFrame(columns=df.columns)
            return empty_df

        filtered_data = df[
            (df["VESSEL GROUP ID"] == vessel_group_id)
            & (df["age"] >= age_range[0])
            & (df["age"] <= age_range[1])
        ]
    else:
        filtered_data = df[(df["age"] >= age_range[0]) & (df["age"] <= age_range[1])]

    return filtered_data


def filter_in_vessel(dataframe, group_name, kelompok=None):
    """
    Memfilter DataFrame agar hanya berisi baris dengan 'last_location' yang
    termasuk dalam daftar vessel dari group yang ditentukan.
    """
    if kelompok is None:
        from repositories.vessel_repository import build_kelompok

        kelompok = build_kelompok()

    if group_name not in kelompok:
        raise ValueError(f"Group '{group_name}' tidak ditemukan dalam kelompok.")

    vessel_list = kelompok[group_name]
    filtered_df = dataframe[dataframe["last_location"].isin(vessel_list)]
    return filtered_df


def get_rotation_group_number(group_key):
    match = re.search(r"rotation(\d+)$", str(group_key))
    if not match:
        return None
    return str(int(match.group(1)))


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

    has_numbered_groups = any(
        get_rotation_group_number(group_key) is not None for group_key in groups.keys()
    )

    vessel_to_group = {}
    for idx, (group_key, ships) in enumerate(groups.items(), start=1):
        group_number = get_rotation_group_number(group_key)
        if group_number is None:
            if has_numbered_groups:
                continue
            group_number = str(idx)

        group_id = f"{prefix}{group_number}"
        for ship in ships:
            vessel_to_group[ship] = group_id

    dataframe = dataframe.copy()
    dataframe["VESSEL GROUP ID"] = (
        dataframe["last_location"].map(vessel_to_group).fillna("UNKNOWN")
    )

    cols = dataframe.columns.tolist()
    vessel_idx = cols.index("last_location")
    cols.insert(vessel_idx + 1, cols.pop(cols.index("VESSEL GROUP ID")))
    dataframe = dataframe[cols]

    return dataframe


load_word2vec_model()
