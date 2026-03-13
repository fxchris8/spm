"""
Module ini mendefinisikan route Blueprint untuk endpoint dashboard,
meliputi data pelaut, statistik kapal, sinkronisasi manual, dan kemiripan pelaut.
"""

from flask import Blueprint

from controllers import (
    get_dashboard_data_controller,
    get_offboard_detail_controller,
    get_similarity_controller,
    get_vessel_stats_controller,
    manual_sync_controller,
)

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


@dashboard_bp.route("/offboard-detail/<string:location>", methods=["GET"])
def get_offboard_detail(location):
    """
    GET /api/offboard-detail/<location>
    Returns seamen list for a given offboard status, including prevlocation.
    """
    return get_offboard_detail_controller(location)


@dashboard_bp.route("/similarity/<int:seaman_code>", methods=["GET"])
def get_similarity(seaman_code):
    """
    GET /api/similarity/<seaman_code>
    Returns top 5 similar seamen based on rank and certificate using Word2Vec.
    """
    return get_similarity_controller(seaman_code)
