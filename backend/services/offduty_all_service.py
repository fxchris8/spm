"""
Module ini menyediakan business logic untuk fitur Search Off Duty - All tab.
Menampilkan semua pelaut offboard (darat/stand-by/pending) tanpa grouping berdasarkan posisi,
dengan filter opsional berdasarkan kategori kapal sebelumnya dan forecast bulan offboard.
"""

import pandas as pd

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


def _classify_vessel_category(prevlocation: str, kelompok: dict) -> str:
    """
    Classify a seaman's previous vessel into a category based on the kelompok mapping.

    Args:
        prevlocation: The seaman's previous vessel name
        kelompok: Dict mapping category -> list of vessel names

    Returns:
        str: Category name (e.g. "container", "manalagi", "bc") or "unknown"
    """
    if not prevlocation or not prevlocation.strip():
        return "unknown"

    prev_upper = prevlocation.strip().upper()

    for category, vessels in kelompok.items():
        vessel_set = frozenset(v.upper() for v in vessels)
        if prev_upper in vessel_set:
            return category

    return "unknown"


def get_all_offduty_seamen(
    vessel_category: str | None = None,
    rank: str | None = None,
    name: str | None = None,
    forecast_month: int = 1,
) -> list:
    """
    Get all offboard seamen without grouping by position.

    For forecast_month=1 (default): returns seamen currently in darat/stand-by/pending status.
    For forecast_month>=2: union of currently offboard + crew on vessels whose
    end_date falls within [today, start of forecast month] (they will be offboard
    after their 1-month leave).

    Each seaman gets an 'offboard_status' field:
        - "Currently Offboard" if last_location is in DARAT/PENDING
        - "Will be Offboard (Sep 2026)" if end_date makes them offboard by September
        - "Will be Offboard (Oct 2026)" if end_date makes them offboard by October

    Args:
        vessel_category: Optional filter by previous vessel category
                         ("bc", "container", "manalagi")
        rank: Optional filter by last_position
        name: Optional partial name search
        forecast_month: 1 = current offboard only, 2 = include October forecast

    Returns:
        list: List of seamen dicts with offboard_status field
    """
    df = get_seamen_as_data()

    # --- Pool 1: Currently offboard (darat/stand-by/pending) ---
    loc_upper = df["last_location"].fillna("").astype(str).str.strip().str.upper()
    is_currently_offboard = loc_upper.isin(_LOKASI_OTHERS_UPPER)
    pool_status = df[is_currently_offboard].copy()
    pool_status["offboard_status"] = "Currently Offboard"

    # --- Pool 2: Forecast — crew on vessels whose end_date is within range ---
    if forecast_month >= 2:
        today = pd.Timestamp.now(tz="UTC").normalize()
        range_end = (today + pd.DateOffset(months=forecast_month)).replace(day=1)
        df["end_date_parsed"] = pd.to_datetime(
            df["end_date"], errors="coerce", utc=True
        )
        pool_vessel = df[
            (~is_currently_offboard)
            & (df["end_date_parsed"] >= today)
            & (df["end_date_parsed"] <= range_end)
        ].copy()

        # Determine which forecast month each seaman falls into
        # Sep boundary: today + 1 month, replace day=1
        sep_boundary = (today + pd.DateOffset(months=1)).replace(day=1)
        pool_vessel["offboard_status"] = pool_vessel["end_date_parsed"].apply(
            lambda d: "Will be Offboard (Sep 2026)"
            if d <= sep_boundary
            else "Will be Offboard (Oct 2026)"
        )

        filtered = pd.concat([pool_status, pool_vessel]).drop_duplicates(
            subset=["seamancode"]
        )
    else:
        # forecast_month=1: also include those whose end_date is within this month
        today = pd.Timestamp.now(tz="UTC").normalize()
        range_end = (today + pd.DateOffset(months=1)).replace(day=1)
        df["end_date_parsed"] = pd.to_datetime(
            df["end_date"], errors="coerce", utc=True
        )
        pool_vessel = df[
            (~is_currently_offboard)
            & (df["end_date_parsed"] >= today)
            & (df["end_date_parsed"] <= range_end)
        ].copy()
        pool_vessel["offboard_status"] = "Will be Offboard (Sep 2026)"

        filtered = pd.concat([pool_status, pool_vessel]).drop_duplicates(
            subset=["seamancode"]
        )

    # --- Filter by vessel category (prevlocation) ---
    if vessel_category and vessel_category.strip():
        kelompok = build_kelompok()
        cat_lower = vessel_category.strip().lower()

        # Build the set of vessel names for the requested category
        if cat_lower in kelompok:
            target_vessels = frozenset(v.upper() for v in kelompok[cat_lower])
        else:
            target_vessels = frozenset()

        # Determine effective previous vessel:
        # For currently offboard seamen, use prevlocation
        # For still-on-vessel seamen, use last_location
        eff_loc = filtered["last_location"].fillna("").astype(str).str.strip()
        is_darat = eff_loc.str.upper().isin(_LOKASI_OTHERS_UPPER)

        prev = (
            filtered["prevlocation"].fillna("").astype(str).str.strip()
            if "prevlocation" in filtered.columns
            else pd.Series("", index=filtered.index)
        )

        effective = eff_loc.copy()
        effective.loc[is_darat] = prev.loc[is_darat]
        effective_upper = effective.str.upper()

        filtered = filtered[effective_upper.isin(target_vessels)]

    # --- Filter by rank ---
    if rank and rank.strip():
        filtered = filtered[
            filtered["last_position"].fillna("").astype(str).str.strip().str.upper()
            == rank.strip().upper()
        ]

    # --- Filter by name ---
    if name and name.strip():
        name_lower = name.strip().lower()
        filtered = filtered[
            filtered["name"]
            .fillna("")
            .astype(str)
            .str.lower()
            .str.contains(name_lower, na=False)
        ]

    # --- Select and return columns ---
    filtered = filtered.sort_values(by=["offboard_status", "last_position", "name"])

    output_cols = [
        "seamancode",
        "seafarercode",
        "name",
        "last_position",
        "last_location",
        "prevlocation",
        "age",
        "certificate",
        "end_date",
        "offboard_status",
        "phone_number_1",
        "phone_number_2",
        "phone_number_3",
        "phone_number_4",
    ]
    # Only keep columns that exist
    output_cols = [c for c in output_cols if c in filtered.columns]

    result_df = filtered[output_cols]

    # Convert end_date to string for JSON serialization
    if "end_date" in result_df.columns:
        result_df = result_df.copy()
        result_df["end_date"] = pd.to_datetime(
            result_df["end_date"], errors="coerce"
        ).dt.strftime("%Y-%m-%d")
        result_df["end_date"] = result_df["end_date"].fillna("")

    return result_df.to_dict(orient="records")
