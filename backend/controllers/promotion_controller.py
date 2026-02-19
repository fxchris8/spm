"""
Promotion Controller
Handles HTTP request/response for promotion candidates (kenaikan pangkat) endpoints.
"""

from flask import jsonify

from services.promotion_service import (
    get_promotion_candidates_kkm,
    get_promotion_candidates_masinisII,
    get_promotion_candidates_masinisIII,
    get_promotion_candidates_masinisIV,
    get_promotion_candidates_mualimI,
    get_promotion_candidates_mualimII,
    get_promotion_candidates_mualimIII,
    get_promotion_candidates_nakhoda,
)


def get_promotion_candidates_nakhoda_controller():
    try:
        result = get_promotion_candidates_nakhoda()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_kkm_controller():
    try:
        result = get_promotion_candidates_kkm()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_mualimI_controller():
    try:
        result = get_promotion_candidates_mualimI()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_masinisII_controller():
    try:
        result = get_promotion_candidates_masinisII()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_mualimII_controller():
    try:
        result = get_promotion_candidates_mualimII()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_masinisIII_controller():
    try:
        result = get_promotion_candidates_masinisIII()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_mualimIII_controller():
    try:
        result = get_promotion_candidates_mualimIII()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_promotion_candidates_masinisIV_controller():
    try:
        result = get_promotion_candidates_masinisIV()
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
