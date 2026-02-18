"""
Cadangan Service
Handles business logic for cadangan (backup/reserve) crew data.
"""

from repositories.cadangan_repository import (
    get_cadangan_kkm,
    get_cadangan_masinis_ii,
    get_cadangan_mualim_i,
    get_cadangan_nakhoda,
)


def get_cadangan_kkm_data() -> list:
    """
    Get cadangan crew data for KKM position.

    Returns:
        list: List of cadangan crew records for KKM
    """
    df = get_cadangan_kkm()
    return df.to_dict(orient="records")


def get_cadangan_nakhoda_data() -> list:
    """
    Get cadangan crew data for NAKHODA position.

    Returns:
        list: List of cadangan crew records for NAKHODA
    """
    df = get_cadangan_nakhoda()
    return df.to_dict(orient="records")


def get_cadangan_mualim_i_data() -> list:
    """
    Get cadangan crew data for MUALIM I position.

    Returns:
        list: List of cadangan crew records for MUALIM I
    """
    df = get_cadangan_mualim_i()
    return df.to_dict(orient="records")


def get_cadangan_masinis_ii_data() -> list:
    """
    Get cadangan crew data for MASINIS II position.

    Returns:
        list: List of cadangan crew records for MASINIS II
    """
    df = get_cadangan_masinis_ii()
    return df.to_dict(orient="records")
