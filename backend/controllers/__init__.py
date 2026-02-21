"""
Controllers Package
Contains HTTP request/response handlers.
Controllers receive requests, call services, and return responses.
"""

from .auth_controller import (
    login_controller,
    logout_controller,
    register_controller,
    me_controller,
)
from .cadangan_controller import (
    get_cadangan_kkm_controller,
    get_cadangan_masinis_ii_controller,
    get_cadangan_mualim_i_controller,
    get_cadangan_nakhoda_controller,
)
from .dashboard_controller import (
    get_dashboard_data_controller,
    get_similarity_controller,
    get_vessel_stats_controller,
)
from .promotion_controller import (
    get_promotion_candidates_kkm_controller,
    get_promotion_candidates_masinisII_controller,
    get_promotion_candidates_masinisIII_controller,
    get_promotion_candidates_masinisIV_controller,
    get_promotion_candidates_mualimI_controller,
    get_promotion_candidates_mualimII_controller,
    get_promotion_candidates_mualimIII_controller,
    get_promotion_candidates_nakhoda_controller,
)
from .search_controller import manual_search_controller
from .sync_controller import manual_sync_controller

__all__ = [
    # Auth Controllers
    "login_controller",
    "logout_controller",
    "register_controller",
    "me_controller",
    # Cadangan Controllers
    "get_cadangan_kkm_controller",
    "get_cadangan_nakhoda_controller",
    "get_cadangan_mualim_i_controller",
    "get_cadangan_masinis_ii_controller",
    # Dashboard Controllers
    "get_dashboard_data_controller",
    "get_vessel_stats_controller",
    "get_similarity_controller",
    # Promotion Controllers
    "get_promotion_candidates_nakhoda_controller",
    "get_promotion_candidates_kkm_controller",
    "get_promotion_candidates_mualimI_controller",
    "get_promotion_candidates_masinisII_controller",
    "get_promotion_candidates_mualimII_controller",
    "get_promotion_candidates_masinisIII_controller",
    "get_promotion_candidates_mualimIII_controller",
    "get_promotion_candidates_masinisIV_controller",
    # Search Controllers
    "manual_search_controller",
    # Sync Controllers
    "manual_sync_controller",
]
