"""
Repositories Package
Contains data access layer for the application.
Repositories handle all database queries and external API calls.
"""

from .dashboard_repository import get_seaman_by_code, get_seamen_data, get_vessels_data
from .external_api_repository import fetch_mutations_from_api, fetch_seamen_from_api
from .search_repository import get_seamen_for_search
from .sync_repository import sync_mutations_to_database, sync_seamen_to_database

__all__ = [
    # Dashboard Repositories
    "get_seamen_data",
    "get_vessels_data",
    "get_seaman_by_code",
    # External API Repositories
    "fetch_seamen_from_api",
    "fetch_mutations_from_api",
    # Search Repositories
    "get_seamen_for_search",
    # Sync Repositories
    "sync_seamen_to_database",
    "sync_mutations_to_database",
]
