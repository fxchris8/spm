from datetime import datetime

import numpy as np
import pandas as pd
from gensim.models import Word2Vec
from sklearn.metrics.pairwise import cosine_similarity

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
    "others": ["DARAT", "Stand by Crew", "PENDING GAJI CUTI", "PENDING GAJI"],
}

# Memuat model Word2Vec secara global
word2vec_model = None


def load_word2vec_model(model_path="word2vec_model.model"):
    """
    Memuat model Word2Vec.
    """
    global word2vec_model
    try:
        word2vec_model = Word2Vec.load(model_path)
        print("Word2Vec model loaded successfully.")
    except Exception as e:
        print(f"Error loading Word2Vec model: {e}")


# Fungsi untuk mendapatkan Vessel Group ID berdasarkan nama vessel
def get_vessel_group_id(df, vessel_name):

    vessel_row = df[df["last_location"] == vessel_name]

    print("vessel row hasil", vessel_row)
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
    print("INI VESSEL NAMEEEEEEEEEE", vessel_name)
    vessel_group_id = get_vessel_group_id(filtered_df, vessel_name)
    filtered_df = filtered_df[(df["VESSEL GROUP ID"] == vessel_group_id)]

    # Memfilter berdasarkan umur
    filtered_df = filtered_df[
        (filtered_df["age"] >= age_range[0]) & (filtered_df["age"] <= age_range[1])
    ]
    print(filtered_df)

    # Menggabungkan fitur RANK dan CERTIFICATE untuk perhitungan similarity
    filtered_df["combined_features"] = (
        filtered_df["last_position"] + " " + filtered_df["certificate"]
    )

    # Fungsi untuk mengubah teks menjadi vektor Word2Vec
    def get_word2vec_vector(text):
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
        print("bagian ", bagian)
        print("vessel group id ", vessel_group_id)
        print("age 0 ", age_range[0])
        print("age 1 ", age_range[1])

        if vessel_group_id is None:
            return (
                pd.DataFrame()
            )  # Return empty DataFrame if no matching vessel is found

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


def filter_in_vessel(dataframe, group_name, kelompok=KELOMPOK):
    if group_name not in kelompok:
        raise ValueError(f"Group '{group_name}' tidak ditemukan dalam kelompok.")

    # Ambil daftar VESSEL untuk group tertentu
    vessel_list = kelompok[group_name]

    # Filter DataFrame berdasarkan kolom 'VESSEL'
    filtered_df = dataframe[dataframe["last_location"].isin(vessel_list)]

    return filtered_df


def vessel_group_id_deck(dataframe, vessel, type=None):
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

    # Jika jenis kapal bukan 'container' atau 'manalagi', langsung isi dengan '1'
    if vessel not in ["container", "manalagi"]:
        dataframe["VESSEL GROUP ID"] = "1"
        return dataframe

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
