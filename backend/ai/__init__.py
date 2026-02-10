"""
AI Package
Contains machine learning models and AI-related utilities.
Includes Word2Vec model for similarity calculations and recommendation algorithms.
"""

from .model import (
    calculate_day_remains_difference,
    filter_in_vessel,
    get_vessel_group_id,
    getRecommendation,
    load_word2vec_model,
    search_candidate,
    vessel_group_id_deck,
    word2vec_model,
)

__all__ = [
    # Word2Vec Model
    "word2vec_model",
    "load_word2vec_model",
    # Recommendation & Search
    "getRecommendation",
    "search_candidate",
    # Vessel Group Utilities
    "get_vessel_group_id",
    "vessel_group_id_deck",
    "filter_in_vessel",
    # Data Processing
    "calculate_day_remains_difference",
]
