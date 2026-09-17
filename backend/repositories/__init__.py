"""
Repositories Package
Contains data access layer for the application.
Repositories handle all database queries and external API calls.
"""

from .cadangan_repository import (
    get_cadangan_kkm,
    get_cadangan_masinis_ii,
    get_cadangan_masinis_iii,
    get_cadangan_masinis_iv,
    get_cadangan_mualim_i,
    get_cadangan_mualim_ii,
    get_cadangan_mualim_iii,
    get_cadangan_nakhoda,
)
from .dashboard_repository import get_offboard_seamen_by_location, get_seaman_by_code, get_seamen_data, get_vessels_data
from .external_api_repository import (
    fetch_mutations_from_api,
    fetch_seamen_from_api,
    fetch_ship_particular_from_api,
)
from .promotion_repository import get_mutations_data
from .search_repository import get_seamen_for_search
from .sync_repository import (
    sync_mutations_to_database,
    sync_seamen_to_database,
    sync_ship_particular_to_database,
)
from .user_repository import create_user, get_user_by_id, get_user_by_username
from .vessel_repository import (
    build_kelompok,
    get_ship_particular_from_db,
    get_vessel_config_from_db,
)

__all__ = [
    # Auth / User Repositories
    "get_user_by_username",
    "get_user_by_id",
    "create_user",
    # Cadangan Repositories
    "get_cadangan_kkm",
    "get_cadangan_nakhoda",
    "get_cadangan_mualim_i",
    "get_cadangan_masinis_ii",
    "get_cadangan_mualim_ii",
    "get_cadangan_mualim_iii",
    "get_cadangan_masinis_iii",
    "get_cadangan_masinis_iv",
    # Dashboard Repositories
    "get_seamen_data",
    "get_vessels_data",
    "get_seaman_by_code",
    "get_offboard_seamen_by_location",
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
    # Ship Particular Repositories
    "fetch_ship_particular_from_api",
    "get_ship_particular_from_db",
    "sync_ship_particular_to_database",
]
