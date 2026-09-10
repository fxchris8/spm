"""
Services Package
Contains business logic layer for the application.
Services process data from repositories and prepare it for controllers.
"""

from .auth_service import (
    build_sso_login_url,
    check_password,
    find_or_create_sso_user,
    fetch_sso_userinfo,
    generate_token,
    generate_sso_state,
    get_current_user,
    hash_password,
    is_sso_enabled,
    login_user,
    login_user_with_sso_code,
    logout_user,
    register_user,
    validate_sso_state,
)
from .cadangan_service import (
    get_cadangan_kkm_data,
    get_cadangan_masinis_ii_data,
    get_cadangan_mualim_i_data,
    get_cadangan_nakhoda_data,
)
from .dashboard_service import (
    get_dashboard_data,
    get_offboard_detail,
    get_ship_particular_list,
    get_similar_seamen,
    get_vessel_stats,
)
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
from .offduty_all_service import get_all_offduty_seamen
from .sync_service import manual_sync, sync_ship_particular

__all__ = [
    # Auth Services
    "login_user",
    "login_user_with_sso_code",
    "logout_user",
    "register_user",
    "hash_password",
    "check_password",
    "generate_token",
    "get_current_user",
    "is_sso_enabled",
    "generate_sso_state",
    "validate_sso_state",
    "build_sso_login_url",
    "fetch_sso_userinfo",
    "find_or_create_sso_user",
    # Cadangan Services
    "get_cadangan_kkm_data",
    "get_cadangan_nakhoda_data",
    "get_cadangan_mualim_i_data",
    "get_cadangan_masinis_ii_data",
    # Dashboard Services
    "get_dashboard_data",
    "get_vessel_stats",
    "get_similar_seamen",
    "get_offboard_detail",
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
    # Off Duty All Services
    "get_all_offduty_seamen",
    # Sync Services
    "manual_sync",
    # Ship Particular Services
    "get_ship_particular_list",
    "sync_ship_particular",
]
