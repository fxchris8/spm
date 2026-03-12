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
    try:
        result = get_promotion_candidates_nakhoda(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_kkm_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    try:
        result = get_promotion_candidates_kkm(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_mualimI_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    try:
        result = get_promotion_candidates_mualimI(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_masinisII_controller(
    forecast_month: int = 1, categorization: str | None = None
):
    try:
        result = get_promotion_candidates_masinisII(forecast_month, categorization)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_mualimII_controller(forecast_month: int = 1):
    try:
        result = get_promotion_candidates_mualimII(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_masinisIII_controller(forecast_month: int = 1):
    try:
        result = get_promotion_candidates_masinisIII(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_mualimIII_controller(forecast_month: int = 1):
    try:
        result = get_promotion_candidates_mualimIII(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_masinisIV_controller(forecast_month: int = 1):
    try:
        result = get_promotion_candidates_masinisIV(forecast_month)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
