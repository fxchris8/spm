"""
Dashboard Service
Handles business logic and data transformation for dashboard.
"""

import pandas as pd

from repositories.dashboard_repository import get_seamen_data, get_vessels_data


def get_dashboard_data():
    """
    Get dashboard data with proper column naming and filtering.

    Returns:
        DataFrame: Processed dashboard data with renamed columns and filtered fields
    """
    # Get raw data from repository
    data = get_seamen_data()

    # Rename columns to match frontend expectations
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

    # Filter only required columns (DAY REMAINS DIFF removed, only needed for similarity)
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

    return data


def get_vessel_stats():
    """
    Get vessel statistics by category (container, manalagi, bc).

    Returns:
        dict: Dictionary with count of unique vessels per category
    """
    # Get rotation vessels from repository
    rotation_vessels = get_vessels_data()

    # Count unique ships per category
    container_ships = set()
    manalagi_ships = set()
    bc_ships = set()

    for vessel in rotation_vessels:
        categorization = vessel.get("categorization", "").lower()
        groups = vessel.get("groups", {})

        # Collect all ships from all groups in this vessel
        for group_ships in groups.values():
            if categorization == "container":
                container_ships.update(group_ships)
            elif categorization == "manalagi":
                manalagi_ships.update(group_ships)
            elif categorization == "bc":
                bc_ships.update(group_ships)

    stats = {
        "container": len(container_ships),
        "manalagi": len(manalagi_ships),
        "bc": len(bc_ships),
    }

    return stats


def get_similar_seamen(target_seaman_code):
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
        from repositories.dashboard_repository import get_seaman_by_code

        # Load Word2Vec model if not loaded
        if word2vec_model is None:
            load_word2vec_model()
            from ai.model import word2vec_model

            if word2vec_model is None:
                return {"status": "error", "message": "Word2Vec model belum dimuat"}

        # Get target seaman
        target_seaman = get_seaman_by_code(target_seaman_code)
        if not target_seaman:
            return {
                "status": "error",
                "message": f"Seaman dengan kode {target_seaman_code} tidak ditemukan",
            }

        rank = target_seaman["last_position"]
        certificate = target_seaman["certificate"]

        print(f"[SIMILARITY] Finding similar seamen for {rank} - {certificate}")

        # Get all seamen except target
        all_seamen = get_seamen_data()
        filtered_candidates = all_seamen[
            all_seamen["seamancode"] != target_seaman_code
        ].copy()

        # Helper function to get Word2Vec vector
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

        # Calculate target vector
        user_input = f"{rank} {certificate}"
        user_vector = get_word2vec_vector(user_input)

        # Calculate vectors for all candidates
        filtered_candidates["combined_text"] = (
            filtered_candidates["last_position"].astype(str)
            + " "
            + filtered_candidates["certificate"].astype(str)
        )
        filtered_candidates["vector"] = filtered_candidates["combined_text"].apply(
            get_word2vec_vector
        )

        # Calculate similarity scores
        filtered_candidates["similarity"] = filtered_candidates["vector"].apply(
            lambda x: float(cosine_similarity([user_vector], [x])[0][0])
        )

        # Get top 5
        top_5 = filtered_candidates.nlargest(5, "similarity")

        # Calculate DAY REMAINS DIFF for similar seamen
        top_5["DAY REMAINS DIFF"] = pd.to_numeric(top_5["day_remains"], errors="coerce")

        # Drop unnecessary columns
        columns_to_drop = [
            "vector",
            "combined_text",
            "phone_number_1",
            "phone_number_2",
            "phone_number_3",
            "phone_number_4",
        ]
        # Only drop columns that exist
        columns_to_drop = [col for col in columns_to_drop if col in top_5.columns]
        top_5 = top_5.drop(columns=columns_to_drop)

        # Convert to dict
        result = top_5.to_dict(orient="records")

        print(f"[SIMILARITY] Found {len(result)} similar seamen")
        return {"status": "success", "data": result}

    except Exception as e:
        print(f"[SIMILARITY ERROR] {str(e)}")
        return {"status": "error", "message": str(e)}
