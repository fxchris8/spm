"""
Services Package
Contains business logic layer for the application.
Services process data from repositories and prepare it for controllers.
"""

from .auth_service import (
    check_password,
    generate_token,
    get_current_user,
    hash_password,
    login_user,
    logout_user,
    register_user,
)
from .cadangan_service import (
    get_cadangan_kkm_data,
    get_cadangan_masinis_ii_data,
    get_cadangan_mualim_i_data,
    get_cadangan_nakhoda_data,
)
from .dashboard_service import get_dashboard_data, get_similar_seamen, get_vessel_stats
from .promotion_service import (
    get_promotion_candidates_kkm,
    get_promotion_candidates_masinisII,
    get_promotion_candidates_masinisIII,
    get_promotion_candidates_masinisIV,
    get_promotion_candidates_mualimI,
    get_promotion_candidates_mualimII,
    get_promotion_candidates_mualimIII,
    get_promotion_candidates_nakhoda,
)
from .search_service import manual_search
from .sync_service import manual_sync

__all__ = [
    # Auth Services
    "login_user",
    "logout_user",
    "register_user",
    "hash_password",
    "check_password",
    "generate_token",
    "get_current_user",
    # Cadangan Services
    "get_cadangan_kkm_data",
    "get_cadangan_nakhoda_data",
    "get_cadangan_mualim_i_data",
    "get_cadangan_masinis_ii_data",
    # Dashboard Services
    "get_dashboard_data",
    "get_vessel_stats",
    "get_similar_seamen",
    # Promotion Services
    "get_promotion_candidates_nakhoda",
    "get_promotion_candidates_kkm",
    "get_promotion_candidates_mualimI",
    "get_promotion_candidates_masinisII",
    "get_promotion_candidates_mualimII",
    "get_promotion_candidates_masinisIII",
    "get_promotion_candidates_mualimIII",
    "get_promotion_candidates_masinisIV",
    # Search Services
    "manual_search",
    # Sync Services
    "manual_sync",
]
