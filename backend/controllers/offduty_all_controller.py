"""
Controller for Search Off Duty - All tab.
Handles HTTP request/response for the all-offduty-seamen endpoint.
"""

from flask import jsonify, request

from services.offduty_all_service import get_all_offduty_seamen


def get_all_offduty_controller():
    """
    Controller for GET /api/search-offduty-all endpoint.

    Query params:
        vessel_category (str, optional): "bc", "container", or "manalagi"
        rank (str, optional): Filter by last_position
        name (str, optional): Partial name search
        forecast_month (int, optional, default=1): 1 or 2

    Returns:
        JSON: List of offboard seamen with offboard_status
    """
    try:
        vessel_category = request.args.get("vessel_category", None, type=str) or None
        rank = request.args.get("rank", None, type=str) or None
        name = request.args.get("name", None, type=str) or None
        forecast_month = request.args.get("forecast_month", 1, type=int)
        if forecast_month not in (1, 2):
            return jsonify({"message": "forecast_month must be 1 or 2"}), 400

        data = get_all_offduty_seamen(
            vessel_category=vessel_category,
            rank=rank,
            name=name,
            forecast_month=forecast_month,
        )
        return jsonify(data), 200

    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500
