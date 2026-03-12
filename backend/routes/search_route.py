"""
Module ini mendefinisikan route Blueprint untuk endpoint pencarian manual pelaut
menggunakan rekomendasi berbasis AI.
"""

from flask import Blueprint

from controllers import manual_search_controller

search_bp = Blueprint("search", __name__)


@search_bp.route("/get-manual-search", methods=["POST"])
def get_manual_search():
    """
    POST /api/get-manual-search — Pencarian manual kandidat pelaut dengan rekomendasi AI.
    """
    return manual_search_controller()
