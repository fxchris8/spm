"""
Module ini mendefinisikan route Blueprint untuk endpoint Search Off Duty - All tab.
Menampilkan semua pelaut offboard tanpa grouping berdasarkan posisi.
"""

from flask import Blueprint

from controllers.offduty_all_controller import get_all_offduty_controller

offduty_all_bp = Blueprint("offduty_all", __name__)


@offduty_all_bp.route("/search-offduty-all", methods=["GET"])
def search_offduty_all():
    """
    GET /api/search-offduty-all — Get all offboard seamen with optional filters.
    Query params: vessel_category, rank, name, forecast_month
    """
    return get_all_offduty_controller()
