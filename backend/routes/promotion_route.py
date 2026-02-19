"""
Promotion Routes
Defines Flask Blueprint for promotion candidates (kenaikan pangkat) endpoints.
"""

from flask import Blueprint

from controllers import (
    get_promotion_candidates_kkm_controller,
    get_promotion_candidates_masinisII_controller,
    get_promotion_candidates_masinisIII_controller,
    get_promotion_candidates_masinisIV_controller,
    get_promotion_candidates_mualimI_controller,
    get_promotion_candidates_mualimII_controller,
    get_promotion_candidates_mualimIII_controller,
    get_promotion_candidates_nakhoda_controller,
)

# Create Blueprint
promotion_bp = Blueprint("promotion", __name__)


@promotion_bp.route("/seamen/promotion-candidates-nakhoda", methods=["GET"])
def get_promotion_candidates_nakhoda():
    """
    GET /api/seamen/promotion-candidates-nakhoda
    Returns promotion candidates for NAKHODA position.
    """
    return get_promotion_candidates_nakhoda_controller()


@promotion_bp.route("/seamen/promotion-candidates-kkm", methods=["GET"])
def get_promotion_candidates_kkm():
    """
    GET /api/seamen/promotion-candidates-kkm
    Returns promotion candidates for KKM position.
    """
    return get_promotion_candidates_kkm_controller()


@promotion_bp.route("/seamen/promotion-candidates-mualimI", methods=["GET"])
def get_promotion_candidates_mualimI():
    """
    GET /api/seamen/promotion-candidates-mualimI
    Returns promotion candidates for MUALIM I position.
    """
    return get_promotion_candidates_mualimI_controller()


@promotion_bp.route("/seamen/promotion-candidates-masinisII", methods=["GET"])
def get_promotion_candidates_masinisII():
    """
    GET /api/seamen/promotion-candidates-masinisII
    Returns promotion candidates for MASINIS II position.
    """
    return get_promotion_candidates_masinisII_controller()


@promotion_bp.route("/seamen/promotion-candidates-mualimII", methods=["GET"])
def get_promotion_candidates_mualimII():
    """
    GET /api/seamen/promotion-candidates-mualimII
    Returns promotion candidates for MUALIM II position.
    """
    return get_promotion_candidates_mualimII_controller()


@promotion_bp.route("/seamen/promotion-candidates-masinisIII", methods=["GET"])
def get_promotion_candidates_masinisIII():
    """
    GET /api/seamen/promotion-candidates-masinisIII
    Returns promotion candidates for MASINIS III position.
    """
    return get_promotion_candidates_masinisIII_controller()


@promotion_bp.route("/seamen/promotion-candidates-mualimIII", methods=["GET"])
def get_promotion_candidates_mualimIII():
    """
    GET /api/seamen/promotion-candidates-mualimIII
    Returns promotion candidates for MUALIM III position.
    """
    return get_promotion_candidates_mualimIII_controller()


@promotion_bp.route("/seamen/promotion-candidates-masinisIV", methods=["GET"])
def get_promotion_candidates_masinisIV():
    """
    GET /api/seamen/promotion-candidates-masinisIV
    Returns promotion candidates for MASINIS IV position.
    """
    return get_promotion_candidates_masinisIV_controller()
