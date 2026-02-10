"""
Search Service
Handles business logic for manual search and AI recommendations.
"""

from ai.model import (
    filter_in_vessel,
    getRecommendation,
    search_candidate,
    vessel_group_id_deck,
)
from repositories.search_repository import get_seamen_for_search


def manual_search(search_params):
    """
    Perform manual search with AI recommendations.

    Args:
        search_params: Dict with TYPE, PART, BAGIAN, VESSEL, LB, UB, RANK, CERTIFICATE

    Returns:
        List of recommended seamen with their details
    """
    try:
        print(f"[MANUAL SEARCH] Starting search with params: {search_params}")

        # Fetch data from database
        df = get_seamen_for_search()

        # Apply vessel type filters
        type_ = search_params["TYPE"].lower()  # Convert to lowercase for KELOMPOK
        part = search_params.get("PART")

        df = filter_in_vessel(df, type_)
        if part:
            df = vessel_group_id_deck(df, type_, part.lower())
        else:
            df = vessel_group_id_deck(df, type_)

        # Extract search parameters
        bagian = search_params["BAGIAN"]
        vessel_name = search_params["VESSEL"]
        age_range = (int(search_params["LB"]), int(search_params["UB"]))

        print(f"[MANUAL SEARCH] Searching candidates in vessel: {vessel_name}")

        # Search candidates based on criteria
        filtered_candidates = search_candidate(df, bagian, vessel_name, age_range)

        if filtered_candidates.empty:
            print("[MANUAL SEARCH] No candidates found")
            return []

        print(
            f"[MANUAL SEARCH] Found {len(filtered_candidates)} candidates, getting recommendations..."
        )

        # Get AI recommendations
        recommendations = getRecommendation(
            df,
            search_params,
            bagian,
            vessel_name,
            search_params["RANK"],
            search_params["CERTIFICATE"],
            age_range,
        )

        # Format result with required fields
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

        print(f"[MANUAL SEARCH] Returning {len(result)} recommendations")
        return result

    except Exception as e:
        print(f"[MANUAL SEARCH ERROR] {str(e)}")
        raise Exception(f"Failed to perform manual search: {str(e)}")
