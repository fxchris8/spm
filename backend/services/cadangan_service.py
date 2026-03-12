"""
Cadangan Service
Handles business logic for cadangan (backup/reserve) crew data.
"""

from repositories import (
    get_cadangan_kkm,
    get_cadangan_masinis_ii,
    get_cadangan_mualim_i,
    get_cadangan_nakhoda,
)


def get_cadangan_kkm_data(forecast_month: int = 1, categorization: str | None = None) -> list:
    """
    Get cadangan crew data for KKM position.

    Returns:
        list: List of cadangan crew records for KKM
    """
    df = get_cadangan_kkm(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_nakhoda_data(forecast_month: int = 1, categorization: str | None = None) -> list:
    """
    Get cadangan crew data for NAKHODA position.

    Returns:
        list: List of cadangan crew records for NAKHODA
    """
    df = get_cadangan_nakhoda(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_mualim_i_data(forecast_month: int = 1, categorization: str | None = None) -> list:
    """
    Get cadangan crew data for MUALIM I position.

    Returns:
        list: List of cadangan crew records for MUALIM I
    """
    df = get_cadangan_mualim_i(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_masinis_ii_data(forecast_month: int = 1, categorization: str | None = None) -> list:
    """
    Get cadangan crew data for MASINIS II position.

    Returns:
        list: List of cadangan crew records for MASINIS II
    """
    df = get_cadangan_masinis_ii(forecast_month, categorization)
    return df.to_dict(orient="records")
