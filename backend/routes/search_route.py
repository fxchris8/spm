"""
Module ini mendefinisikan route Blueprint untuk endpoint pencarian manual pelaut
menggunakan rekomendasi berbasis AI.
"""

from flask import Blueprint

from controllers import manual_search_controller, get_all_onduty_controller

search_bp = Blueprint("search", __name__)


@search_bp.route("/get-manual-search", methods=["POST"])
def get_manual_search():
    """
    POST /api/get-manual-search — Pencarian manual kandidat pelaut dengan rekomendasi AI.
    """
    return manual_search_controller()


@search_bp.route("/search-onduty-all", methods=["GET"])
def get_search_onduty_all():
    """
    GET /api/search-onduty-all — Pencarian fleksibel semua kru aktif on-board.
    """
    return get_all_onduty_controller()

