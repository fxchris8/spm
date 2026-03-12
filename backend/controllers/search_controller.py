"""
Module ini menangani pencarian manual kandidat pelaut berdasarkan parameter
seperti tipe kapal, jabatan, sertifikat, dan rentang usia menggunakan rekomendasi AI.
"""

from flask import jsonify, request

from services import manual_search


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
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500
