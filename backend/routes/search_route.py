"""
Search Routes
Defines URL routes for search functionality.
"""

from flask import Blueprint

from controllers import manual_search_controller

search_bp = Blueprint("search", __name__)


@search_bp.route("/get-manual-search", methods=["POST"])
def get_manual_search():
    """Manual search endpoint with AI recommendations"""
    return manual_search_controller()
