"""
Promotion Controller
Handles HTTP request/response for promotion candidates (kenaikan pangkat) endpoints.
"""

from flask import jsonify

from services import (
    get_promotion_candidates_kkm,
    get_promotion_candidates_masinisII,
    get_promotion_candidates_masinisIII,
    get_promotion_candidates_masinisIV,
    get_promotion_candidates_mualimI,
    get_promotion_candidates_mualimII,
    get_promotion_candidates_mualimIII,
    get_promotion_candidates_nakhoda,
)


def get_promotion_candidates_nakhoda_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    """
    Controller untuk GET /api/promotion-candidates-nakhoda.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Nakhoda.
    """
    try:
        result = get_promotion_candidates_nakhoda(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_kkm_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    """
    Controller untuk GET /api/promotion-candidates-kkm.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi KKM.
    """
    try:
        result = get_promotion_candidates_kkm(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_mualimI_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    """
    Controller untuk GET /api/promotion-candidates-mualimI.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Mualim I.
    """
    try:
        result = get_promotion_candidates_mualimI(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_masinisII_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    """
    Controller untuk GET /api/promotion-candidates-masinisII.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Masinis II.
    """
    try:
        result = get_promotion_candidates_masinisII(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_mualimII_controller(forecast_month: int = 1):
    """
    Controller untuk GET /api/promotion-candidates-mualimII.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Mualim II.
    """
    try:
        result = get_promotion_candidates_mualimII(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_masinisIII_controller(forecast_month: int = 1):
    """
    Controller untuk GET /api/promotion-candidates-masinisIII.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Masinis III.
    """
    try:
        result = get_promotion_candidates_masinisIII(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_mualimIII_controller(forecast_month: int = 1):
    """
    Controller untuk GET /api/promotion-candidates-mualimIII.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Mualim III.
    """
    try:
        result = get_promotion_candidates_mualimIII(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def get_promotion_candidates_masinisIV_controller(forecast_month: int = 1):
    """
    Controller untuk GET /api/promotion-candidates-masinisIV.
    Mengembalikan daftar kandidat kenaikan pangkat ke posisi Masinis IV.
    """
    try:
        result = get_promotion_candidates_masinisIV(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500
