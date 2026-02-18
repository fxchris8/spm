"""
Routes Package
Contains Flask Blueprint definitions for API endpoints.
Routes define URL patterns and map them to controllers.
"""

from .cadangan_route import cadangan_bp
from .dashboard_route import dashboard_bp
from .search_route import search_bp

__all__ = [
    "cadangan_bp",
    "dashboard_bp",
    "search_bp",
]
