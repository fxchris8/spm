"""
Cadangan Repository
Handles data access for cadangan (backup/reserve) crew data.

Cadangan = crew yang sedang tidak bertugas di kapal (darat/stand-by/pending).
Data diambil langsung dari database seamen dan difilter berdasarkan lokasi & posisi.
"""

import pandas as pd

from ai.model import filter_in_vessel
from database.connection import get_seamen_as_data

# Lokasi yang dikategorikan sebagai "tidak bertugas di kapal" (others)
_LOKASI_OTHERS = [
    "DARAT",
    "DARAT BIASA",
    "DARAT STAND-BY",
    "Stand by Crew",
    "PENDING CUTI",
    "PENDING GAJI",
]

# Mapping kategori vessel ke daftar nama kapal (digunakan oleh filter_in_vessel)
_KELOMPOK = {
    "others": _LOKASI_OTHERS,
}


def _get_cadangan_by_position(position: str) -> pd.DataFrame:
    """
    Retrieve backup crew data filtered by position.
    Fetches seamen who are currently not assigned to a vessel (darat/stand-by/pending).

    Args:
        position: Job position to filter by (e.g. "KKM", "NAKHODA")

    Returns:
        DataFrame: Cadangan crew data with columns [name, last_location, seamancode]
    """
    df = get_seamen_as_data()
    filtered = filter_in_vessel(df, "others", _KELOMPOK)
    filtered = filtered[filtered["last_position"] == position]
    filtered = filtered.sort_values(by="last_location")
    return filtered[["name", "last_location", "seamancode"]]


def get_cadangan_kkm() -> pd.DataFrame:
    """
    Retrieve backup crew data for KKM position.

    Returns:
        DataFrame: Cadangan crew data for KKM
    """
    return _get_cadangan_by_position("KKM")


def get_cadangan_nakhoda() -> pd.DataFrame:
    """
    Retrieve backup crew data for NAKHODA position.

    Returns:
        DataFrame: Cadangan crew data for NAKHODA
    """
    return _get_cadangan_by_position("NAKHODA")


def get_cadangan_mualim_i() -> pd.DataFrame:
    """
    Retrieve backup crew data for MUALIM I position.

    Returns:
        DataFrame: Cadangan crew data for MUALIM I
    """
    return _get_cadangan_by_position("MUALIM I")


def get_cadangan_masinis_ii() -> pd.DataFrame:
    """
    Retrieve backup crew data for MASINIS II position.

    Returns:
        DataFrame: Cadangan crew data for MASINIS II
    """
    return _get_cadangan_by_position("MASINIS II")
