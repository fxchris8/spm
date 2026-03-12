"""
Cadangan Routes
Defines Flask Blueprint for cadangan (backup/reserve) crew endpoints.
"""

from flask import Blueprint, request

from controllers import (
    get_cadangan_kkm_controller,
    get_cadangan_masinis_ii_controller,
    get_cadangan_mualim_i_controller,
    get_cadangan_nakhoda_controller,
)

# Create Blueprint
cadangan_bp = Blueprint("cadangan", __name__)


@cadangan_bp.route("/cadangan-KKM", methods=["GET"])
def get_cadangan_kkm():
    """
    GET /api/cadangan-KKM
    Returns cadangan (backup) crew data for KKM position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_kkm_controller(forecast_month, categorization)


@cadangan_bp.route("/cadangan-nakhoda", methods=["GET"])
def get_cadangan_nakhoda():
    """
    GET /api/cadangan-nakhoda
    Returns cadangan (backup) crew data for NAKHODA position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_nakhoda_controller(forecast_month, categorization)


@cadangan_bp.route("/cadangan-mualimI", methods=["GET"])
def get_cadangan_mualim_i():
    """
    GET /api/cadangan-mualimI
    Returns cadangan (backup) crew data for MUALIM I position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_mualim_i_controller(forecast_month, categorization)


@cadangan_bp.route("/cadangan-masinisII", methods=["GET"])
def get_cadangan_masinis_ii():
    """
    GET /api/cadangan-masinisII
    Returns cadangan (backup) crew data for MASINIS II position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_masinis_ii_controller(forecast_month, categorization)
