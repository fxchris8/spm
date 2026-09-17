"""
Module ini menyediakan business logic untuk data cadangan (backup/reserve) crew berdasarkan posisi jabatan.
"""

from repositories import (
    get_cadangan_kkm,
    get_cadangan_masinis_ii,
    get_cadangan_masinis_iii,
    get_cadangan_masinis_iv,
    get_cadangan_mualim_i,
    get_cadangan_mualim_ii,
    get_cadangan_mualim_iii,
    get_cadangan_nakhoda,
)


def get_cadangan_kkm_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for KKM position.

    Returns:
        list: List of cadangan crew records for KKM
    """
    df = get_cadangan_kkm(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_nakhoda_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for NAKHODA position.

    Returns:
        list: List of cadangan crew records for NAKHODA
    """
    df = get_cadangan_nakhoda(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_mualim_i_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for MUALIM I position.

    Returns:
        list: List of cadangan crew records for MUALIM I
    """
    df = get_cadangan_mualim_i(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_masinis_ii_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for MASINIS II position.

    Returns:
        list: List of cadangan crew records for MASINIS II
    """
    df = get_cadangan_masinis_ii(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_mualim_ii_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for MUALIM II position.

    Returns:
        list: List of cadangan crew records for MUALIM II
    """
    df = get_cadangan_mualim_ii(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_mualim_iii_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for MUALIM III position.

    Returns:
        list: List of cadangan crew records for MUALIM III
    """
    df = get_cadangan_mualim_iii(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_masinis_iii_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for MASINIS III position.

    Returns:
        list: List of cadangan crew records for MASINIS III
    """
    df = get_cadangan_masinis_iii(forecast_month, categorization)
    return df.to_dict(orient="records")


def get_cadangan_masinis_iv_data(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get cadangan crew data for MASINIS IV position.

    Returns:
        list: List of cadangan crew records for MASINIS IV
    """
    df = get_cadangan_masinis_iv(forecast_month, categorization)
    return df.to_dict(orient="records")
