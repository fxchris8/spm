"""
Promotion Repository
Handles data access for promotion candidates (kenaikan pangkat) data.
"""

from database.connection import get_mutations_as_data, get_seamen_as_data


def get_mutations_data():
    """
    Retrieve mutation history data from database.

    Returns:
        DataFrame: Raw mutations/history data
    """
    return get_mutations_as_data()


def get_seamen_data():
    """
    Retrieve seamen data from database.

    Returns:
        DataFrame: Raw seamen data
    """
    return get_seamen_as_data()
