"""
Cadangan Controller
Handles HTTP request/response for cadangan (backup/reserve) crew endpoints.
"""

from flask import jsonify

from services import (
    get_cadangan_kkm_data,
    get_cadangan_masinis_ii_data,
    get_cadangan_mualim_i_data,
    get_cadangan_nakhoda_data,
)


def get_cadangan_kkm_controller(forecast_month: int = 1, categorization: str | None = None):
    """
    Controller for GET /api/cadangan-KKM endpoint.

    Returns:
        JSON: Cadangan crew data for KKM
    """
    try:
        data = get_cadangan_kkm_data(forecast_month, categorization)
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_cadangan_nakhoda_controller(forecast_month: int = 1, categorization: str | None = None):
    """
    Controller for GET /api/cadangan-nakhoda endpoint.

    Returns:
        JSON: Cadangan crew data for NAKHODA
    """
    try:
        data = get_cadangan_nakhoda_data(forecast_month, categorization)
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_cadangan_mualim_i_controller(forecast_month: int = 1, categorization: str | None = None):
    """
    Controller for GET /api/cadangan-mualimI endpoint.

    Returns:
        JSON: Cadangan crew data for MUALIM I
    """
    try:
        data = get_cadangan_mualim_i_data(forecast_month, categorization)
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_cadangan_masinis_ii_controller(forecast_month: int = 1, categorization: str | None = None):
    """
    Controller for GET /api/cadangan-masinisII endpoint.

    Returns:
        JSON: Cadangan crew data for MASINIS II
    """
    try:
        data = get_cadangan_masinis_ii_data(forecast_month, categorization)
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
