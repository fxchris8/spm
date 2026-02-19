"""
Cadangan Routes
Defines Flask Blueprint for cadangan (backup/reserve) crew endpoints.
"""

from flask import Blueprint

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
    """
    return get_cadangan_kkm_controller()


@cadangan_bp.route("/cadangan-nakhoda", methods=["GET"])
def get_cadangan_nakhoda():
    """
    GET /api/cadangan-nakhoda
    Returns cadangan (backup) crew data for NAKHODA position.
    """
    return get_cadangan_nakhoda_controller()


@cadangan_bp.route("/cadangan-mualimI", methods=["GET"])
def get_cadangan_mualim_i():
    """
    GET /api/cadangan-mualimI
    Returns cadangan (backup) crew data for MUALIM I position.
    """
    return get_cadangan_mualim_i_controller()


@cadangan_bp.route("/cadangan-masinisII", methods=["GET"])
def get_cadangan_masinis_ii():
    """
    GET /api/cadangan-masinisII
    Returns cadangan (backup) crew data for MASINIS II position.
    """
    return get_cadangan_masinis_ii_controller()
