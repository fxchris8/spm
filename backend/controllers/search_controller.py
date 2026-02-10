"""
Search Controller
Handles HTTP requests for manual search functionality.
"""

from flask import jsonify, request

from services.search_service import manual_search


def manual_search_controller():
    """
    POST /api/get-manual-search
    Perform manual search with AI recommendations.

    Request Body:
        TYPE: Vessel type (e.g., "CONTAINER", "MANALAGI")
        PART: Vessel part (e.g., "DECK", "ENGINE")
        BAGIAN: Department/section
        VESSEL: Vessel name
        LB: Lower bound age
        UB: Upper bound age
        RANK: Position rank
        CERTIFICATE: Certificate type

    Returns:
        JSON: List of recommended seamen
    """
    try:
        search_params = request.json

        if not search_params:
            return jsonify({"error": "No search parameters provided"}), 400

        # Validate required fields
        required_fields = [
            "TYPE",
            "BAGIAN",
            "VESSEL",
            "LB",
            "UB",
            "RANK",
            "CERTIFICATE",
        ]
        for field in required_fields:
            if field not in search_params:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        result = manual_search(search_params)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500
