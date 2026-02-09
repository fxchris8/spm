"""
Dashboard Routes
Defines Flask Blueprint for dashboard endpoints.
"""

from flask import Blueprint

from controllers.dashboard_controller import (
    get_dashboard_data_controller,
    get_vessel_stats_controller,
)
from controllers.sync_controller import manual_sync_controller

# Create Blueprint
dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard-data", methods=["GET"])
def get_dashboard_data():
    """
    GET /api/dashboard-data
    Returns dashboard data with seamen information.
    """
    return get_dashboard_data_controller()


@dashboard_bp.route("/vessel-stats", methods=["GET"])
def get_vessel_stats():
    """
    GET /api/vessel-stats
    Returns the count of unique vessels for each category.
    Categories: container, manalagi, bc
    """
    return get_vessel_stats_controller()


@dashboard_bp.route("/manual-sync", methods=["POST"])
def manual_sync():
    """
    POST /api/manual-sync
    Manually trigger data sync from external API to database.
    """
    return manual_sync_controller()
