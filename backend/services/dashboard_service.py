"""
Module ini menyediakan business logic dan transformasi data untuk dashboard, termasuk statistik vessel dan rekomendasi seamen serupa.
"""

import pandas as pd

from models import SeamanRecord, SimilarSeamanResult, VesselStats
from repositories import get_seaman_by_code, get_seamen_data, get_vessels_data


def get_dashboard_data():
    """
    Get dashboard data with proper column naming and filtering.

    Returns:
        DataFrame: Processed dashboard data with renamed columns and filtered fields
    """
    data = get_seamen_data()

    data = data.rename(columns=SeamanRecord.COLUMN_MAP)

    data = data[SeamanRecord.DISPLAY_COLUMNS]

    return data


def get_vessel_stats() -> dict:
    """
    Get vessel statistics by category (container, manalagi, bc).

    Returns:
        dict: Dictionary with count of unique vessels per category
    """
    rotation_vessels = get_vessels_data()

    container_ships = set()
    manalagi_ships = set()
    bc_ships = set()

    for vessel in rotation_vessels:
        categorization = vessel.get("categorization", "").lower()
        groups = vessel.get("groups", {})

        for group_ships in groups.values():
            if categorization == "container":
                container_ships.update(group_ships)
            elif categorization == "manalagi":
                manalagi_ships.update(group_ships)
            elif categorization == "bc":
                bc_ships.update(group_ships)

    stats = VesselStats(
        container=len(container_ships),
        manalagi=len(manalagi_ships),
        bc=len(bc_ships),
    )

    return stats.to_dict()


def get_similar_seamen(target_seaman_code) -> dict:
    """
    Get top 5 similar seamen based on rank and certificate using Word2Vec.

    Args:
        target_seaman_code: Target seaman code to find similar seamen for

    Returns:
        dict: Response with status and list of similar seamen
    """
    try:
        import numpy as np
        from sklearn.metrics.pairwise import cosine_similarity

        from ai.model import load_word2vec_model, word2vec_model

        if word2vec_model is None:
            load_word2vec_model()
            from ai.model import word2vec_model

            if word2vec_model is None:
                return SimilarSeamanResult(
                    status="error", message="Word2Vec model belum dimuat"
                ).to_dict()

        target_seaman = get_seaman_by_code(target_seaman_code)
        if not target_seaman:
            return SimilarSeamanResult(
                status="error",
                message=f"Seaman dengan kode {target_seaman_code} tidak ditemukan",
            ).to_dict()

        rank = target_seaman["last_position"]
        certificate = target_seaman["certificate"]

        all_seamen = get_seamen_data()
        filtered_candidates = all_seamen[
            all_seamen["seamancode"] != target_seaman_code
        ].copy()

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
            except Exception:
                return np.zeros(word2vec_model.vector_size)

        user_input = f"{rank} {certificate}"
        user_vector = get_word2vec_vector(user_input)

        filtered_candidates["combined_text"] = (
            filtered_candidates["last_position"].astype(str)
            + " "
            + filtered_candidates["certificate"].astype(str)
        )
        filtered_candidates["vector"] = filtered_candidates["combined_text"].apply(
            get_word2vec_vector
        )

        filtered_candidates["similarity"] = filtered_candidates["vector"].apply(
            lambda x: float(cosine_similarity([user_vector], [x])[0][0])
        )

        top_5 = filtered_candidates.nlargest(5, "similarity")

        top_5["DAY REMAINS DIFF"] = pd.to_numeric(top_5["day_remains"], errors="coerce")

        columns_to_drop = [
            "vector",
            "combined_text",
            "phone_number_1",
            "phone_number_2",
            "phone_number_3",
            "phone_number_4",
        ]
        columns_to_drop = [col for col in columns_to_drop if col in top_5.columns]
        top_5 = top_5.drop(columns=columns_to_drop)

        result = top_5.to_dict(orient="records")

        return SimilarSeamanResult(status="success", data=result).to_dict()

    except Exception as e:
        return SimilarSeamanResult(status="error", message=str(e)).to_dict()
