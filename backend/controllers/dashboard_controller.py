"""
Dashboard Controller
Handles HTTP request/response for dashboard endpoints.
"""

from flask import jsonify

from services.dashboard_service import get_dashboard_data, get_vessel_stats


def get_dashboard_data_controller():
    """
    Controller for GET /api/dashboard-data endpoint.

    Returns:
        JSON: Dashboard data as JSON response
    """
    try:
        data = get_dashboard_data()
        return data.to_json(orient="records")

    except Exception as e:
        return (
            jsonify({"status": "error", "message": f"Failed to get dashboard data: {str(e)}"}),
            500,
        )


def get_vessel_stats_controller():
    """
    Controller for GET /api/vessel-stats endpoint.

    Returns:
        JSON: Vessel statistics by category
    """
    try:
        stats = get_vessel_stats()

        return jsonify(stats), 200

    except Exception as e:
        print(f"[VESSEL STATS ERROR] {str(e)}")
        return (
            jsonify({"status": "error", "message": f"Failed to get vessel stats: {str(e)}"}),
            500,
        )
