"""
Repositories Package
Contains data access layer for the application.
Repositories handle all database queries and external API calls.
"""

from .cadangan_repository import (
    get_cadangan_kkm,
    get_cadangan_masinis_ii,
    get_cadangan_mualim_i,
    get_cadangan_nakhoda,
)
from .dashboard_repository import get_seaman_by_code, get_seamen_data, get_vessels_data
from .external_api_repository import fetch_mutations_from_api, fetch_seamen_from_api
from .promotion_repository import get_mutations_data
from .search_repository import get_seamen_for_search
from .sync_repository import sync_mutations_to_database, sync_seamen_to_database

__all__ = [
    # Cadangan Repositories
    "get_cadangan_kkm",
    "get_cadangan_nakhoda",
    "get_cadangan_mualim_i",
    "get_cadangan_masinis_ii",
    # Dashboard Repositories
    "get_seamen_data",
    "get_vessels_data",
    "get_seaman_by_code",
    # Promotion Repositories
    "get_mutations_data",
    # External API Repositories
    "fetch_seamen_from_api",
    "fetch_mutations_from_api",
    # Search Repositories
    "get_seamen_for_search",
    # Sync Repositories
    "sync_seamen_to_database",
    "sync_mutations_to_database",
]
