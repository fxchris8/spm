"""
Controllers Package
Contains HTTP request/response handlers.
Controllers receive requests, call services, and return responses.
"""

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
from .search_controller import manual_search_controller
from .sync_controller import manual_sync_controller

__all__ = [
    # Cadangan Controllers
    "get_cadangan_kkm_controller",
    "get_cadangan_nakhoda_controller",
    "get_cadangan_mualim_i_controller",
    "get_cadangan_masinis_ii_controller",
    # Dashboard Controllers
    "get_dashboard_data_controller",
    "get_vessel_stats_controller",
    "get_similarity_controller",
    # Search Controllers
    "manual_search_controller",
    # Sync Controllers
    "manual_sync_controller",
]
