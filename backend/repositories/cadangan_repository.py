"""
Module ini menangani akses data untuk crew cadangan (darat/stand-by/pending).
Data diambil dari database seamen dan difilter berdasarkan lokasi, posisi, dan kategori kapal.
"""

import pandas as pd

from ai.model import filter_in_vessel
from database.connection import get_seamen_as_data
from repositories.vessel_repository import build_kelompok

_LOKASI_OTHERS = [
    "DARAT",
    "DARAT BIASA",
    "DARAT STAND-BY",
    "Stand by Crew",
    "PENDING CUTI",
    "PENDING GAJI",
]

_LOKASI_OTHERS_UPPER = frozenset(loc.upper() for loc in _LOKASI_OTHERS)

_KELOMPOK = {
    "others": _LOKASI_OTHERS,
}


def _filter_by_categorization(
    df: pd.DataFrame, categorization: str | None
) -> pd.DataFrame:
    """
    Filter seamen by vessel category (container/manalagi).

    Uses last_location for vessel crew, prevlocation for darat/pending crew.
    Crew with no determinable category (no history) are included (lenient).
    Vessel lists sourced from DB via build_kelompok() for accuracy.

    Rules:
        container: exclude everything that is NOT container (manalagi, bc, mt, tb, tk)
        manalagi: exclude everything that is NOT manalagi (container, bc, mt, tb, tk)
        Unknown vessels (not in any category) are included (lenient).
    """
    if not categorization:
        return df

    kelompok = build_kelompok()
    manalagi_set = frozenset(v.upper() for v in kelompok.get("manalagi", []))
    container_set = frozenset(v.upper() for v in kelompok.get("container", []))
    bc_set = frozenset(v.upper() for v in kelompok.get("bc", []))
    mt_set = frozenset(v.upper() for v in kelompok.get("mt", []))
    tb_set = frozenset(v.upper() for v in kelompok.get("tb", []))
    tk_set = frozenset(v.upper() for v in kelompok.get("tk", []))

    loc = df["last_location"].fillna("").astype(str).str.strip()
    is_darat = loc.str.upper().isin(_LOKASI_OTHERS_UPPER)

    prev = (
        df["prevlocation"].fillna("").astype(str).str.strip()
        if "prevlocation" in df.columns
        else pd.Series("", index=df.index)
    )

    eff = loc.copy()
    eff.loc[is_darat] = prev.loc[is_darat]
    eff_upper = eff.str.upper()

    is_manalagi = eff_upper.isin(manalagi_set)
    is_container = eff_upper.isin(container_set)
    is_bc = eff_upper.isin(bc_set)
    is_mt = eff_upper.isin(mt_set)
    is_tb = eff_upper.isin(tb_set)
    is_tk = eff_upper.isin(tk_set)

    non_fleet = is_bc | is_mt | is_tb | is_tk

    if categorization == "container":
        mask = ~is_manalagi & ~non_fleet
    elif categorization == "manalagi":
        mask = ~is_container & ~non_fleet
    else:
        mask = pd.Series(True, index=df.index)

    return df[mask]


def _get_cadangan_by_position(
    position: str, forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data filtered by position.

    For forecast_month=1 (default): returns crew in darat/stand-by/pending status.
    For forecast_month>=2: union of fm=1 (darat/pending) + crew on vessels whose
    end_date falls within [today, start of forecast month].

    Args:
        position: Job position to filter by (e.g. "KKM", "NAKHODA")
        forecast_month: 1 = next month (status-based), 2+ = forecast (end_date-based)
        categorization: Optional vessel category filter ("container" or "manalagi")

    Returns:
        DataFrame: Cadangan crew data with columns [name, last_location, seamancode]
    """
    df = get_seamen_as_data()

    pool_status = filter_in_vessel(df, "others", _KELOMPOK)
    pool_status = pool_status[pool_status["last_position"] == position]

    if forecast_month >= 2:
        today = pd.Timestamp.now(tz="UTC").normalize()
        range_end = (today + pd.DateOffset(months=forecast_month)).replace(day=1)
        df["end_date"] = pd.to_datetime(df["end_date"], errors="coerce", utc=True)
        pool_vessel = df[
            (df["last_position"] == position)
            & (~df["last_location"].isin(_LOKASI_OTHERS))
            & (df["end_date"] >= today)
            & (df["end_date"] <= range_end)
        ]
        filtered = pd.concat([pool_status, pool_vessel]).drop_duplicates(
            subset=["seamancode"]
        )
    else:
        filtered = pool_status

    filtered = _filter_by_categorization(filtered, categorization)

    filtered = filtered.sort_values(by="last_location")
    return filtered[["name", "last_location", "seamancode"]]


def get_cadangan_kkm(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for KKM position.

    Returns:
        DataFrame: Cadangan crew data for KKM
    """
    return _get_cadangan_by_position("KKM", forecast_month, categorization)


def get_cadangan_nakhoda(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for NAKHODA position.

    Returns:
        DataFrame: Cadangan crew data for NAKHODA
    """
    return _get_cadangan_by_position("NAKHODA", forecast_month, categorization)


def get_cadangan_mualim_i(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for MUALIM I position.

    Returns:
        DataFrame: Cadangan crew data for MUALIM I
    """
    return _get_cadangan_by_position("MUALIM I", forecast_month, categorization)


def get_cadangan_masinis_ii(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for MASINIS II position.

    Returns:
        DataFrame: Cadangan crew data for MASINIS II
    """
    return _get_cadangan_by_position("MASINIS II", forecast_month, categorization)


def get_cadangan_mualim_ii(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for MUALIM II position.

    Returns:
        DataFrame: Cadangan crew data for MUALIM II
    """
    return _get_cadangan_by_position("MUALIM II", forecast_month, categorization)


def get_cadangan_mualim_iii(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for MUALIM III position.

    Returns:
        DataFrame: Cadangan crew data for MUALIM III
    """
    return _get_cadangan_by_position("MUALIM III", forecast_month, categorization)


def get_cadangan_masinis_iii(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for MASINIS III position.

    Returns:
        DataFrame: Cadangan crew data for MASINIS III
    """
    return _get_cadangan_by_position("MASINIS III", forecast_month, categorization)


def get_cadangan_masinis_iv(
    forecast_month: int = 1, categorization: str | None = None
) -> pd.DataFrame:
    """
    Retrieve backup crew data for MASINIS IV position.

    Returns:
        DataFrame: Cadangan crew data for MASINIS IV
    """
    return _get_cadangan_by_position("MASINIS IV", forecast_month, categorization)
