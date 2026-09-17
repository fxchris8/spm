"""
Module ini mendefinisikan route Blueprint untuk endpoint crew cadangan
(darat/stand-by/pending) berdasarkan posisi jabatan pelaut.
"""

from flask import Blueprint, request

from controllers import (
    get_cadangan_kkm_controller,
    get_cadangan_masinis_ii_controller,
    get_cadangan_masinis_iii_controller,
    get_cadangan_masinis_iv_controller,
    get_cadangan_mualim_i_controller,
    get_cadangan_mualim_ii_controller,
    get_cadangan_mualim_iii_controller,
    get_cadangan_nakhoda_controller,
)

cadangan_bp = Blueprint("cadangan", __name__)


@cadangan_bp.route("/cadangan-KKM", methods=["GET"])
@cadangan_bp.route("/cadangan-kkm", methods=["GET"])
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


@cadangan_bp.route("/cadangan-mualimII", methods=["GET"])
def get_cadangan_mualim_ii():
    """
    GET /api/cadangan-mualimII
    Returns cadangan (backup) crew data for MUALIM II position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_mualim_ii_controller(forecast_month, categorization)


@cadangan_bp.route("/cadangan-mualimIII", methods=["GET"])
def get_cadangan_mualim_iii():
    """
    GET /api/cadangan-mualimIII
    Returns cadangan (backup) crew data for MUALIM III position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_mualim_iii_controller(forecast_month, categorization)


@cadangan_bp.route("/cadangan-masinisIII", methods=["GET"])
def get_cadangan_masinis_iii():
    """
    GET /api/cadangan-masinisIII
    Returns cadangan (backup) crew data for MASINIS III position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_masinis_iii_controller(forecast_month, categorization)


@cadangan_bp.route("/cadangan-masinisIV", methods=["GET"])
def get_cadangan_masinis_iv():
    """
    GET /api/cadangan-masinisIV
    Returns cadangan (backup) crew data for MASINIS IV position.
    Query params: forecast_month (int, default=1), categorization (str, optional)
    """
    forecast_month = request.args.get("forecast_month", 1, type=int)
    categorization = request.args.get("categorization", None, type=str) or None
    return get_cadangan_masinis_iv_controller(forecast_month, categorization)
