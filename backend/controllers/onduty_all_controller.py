"""
Controller: onduty_all_controller.py
Handles HTTP request/response for the unified Search On-Duty endpoint.
Provides flexible filtering of all active on-board seamen.
"""

from flask import jsonify, request
from services.onduty_all_service import get_all_onduty_seamen


def get_all_onduty_controller():
    """
    Controller for GET /api/search-onduty-all endpoint.

    Query params (all optional):
        vessel (str): Partial or exact vessel name
        vessel_category (str): "container", "manalagi", or "bc"
        part (str): "deck" or "engine"
        rank (str): Position rank (e.g. "NAKHODA", "KKM")
        name (str): Partial name search or seamancode

    Returns:
        JSON: List of active on-duty seamen
    """
    try:
        vessel = request.args.get("vessel", None, type=str) or None
        vessel_category = request.args.get("vessel_category", None, type=str) or None
        part = request.args.get("part", None, type=str) or None
        rank = request.args.get("rank", None, type=str) or None
        name = request.args.get("name", None, type=str) or None

        data = get_all_onduty_seamen(
            vessel=vessel,
            vessel_category=vessel_category,
            part=part,
            rank=rank,
            name=name,
        )
        return jsonify(data), 200

    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500

