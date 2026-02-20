"""
Routes Package
Contains Flask Blueprint definitions for API endpoints.
Routes define URL patterns and map them to controllers.
"""

from .auth_route import auth_bp
from .cadangan_route import cadangan_bp
from .dashboard_route import dashboard_bp
from .promotion_route import promotion_bp
from .search_route import search_bp

__all__ = [
    "auth_bp",
    "cadangan_bp",
    "dashboard_bp",
    "promotion_bp",
    "search_bp",
]
