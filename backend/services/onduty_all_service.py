"""
Module: onduty_all_service.py
Provides business logic for the unified 'Search On-Duty (New)' feature.
Retrieves and filters active on-board seamen across vessels with completely optional filters:
vessel name, vessel category, department (deck/engine), position rank, and crew name/code.
"""

from typing import Any, Dict, List, Optional
import pandas as pd

from database.connection import get_seamen_as_data
from repositories.vessel_repository import build_kelompok
from utils.vessel_normalizer import normalize_vessel_name, normalize_vessel_set

_LOKASI_OTHERS = [
    "DARAT",
    "DARAT BIASA",
    "DARAT STAND-BY",
    "Stand by Crew",
    "PENDING CUTI",
    "PENDING GAJI",
    "PENDING GAJI CUTI",
    "OFF DUTY",
    "RESIGN",
]
_LOKASI_OTHERS_UPPER = frozenset(loc.upper() for loc in _LOKASI_OTHERS)

DECK_RANKS = frozenset([
    "NAKHODA",
    "MUALIM I",
    "MUALIM II",
    "MUALIM III",
    "MUALIM IV",
    "BOSUN",
    "SERANG",
    "JURU MUDI",
    "KELASI",
    "KADET DEK",
    "EXT. MUALIM I",
    "PENGATUR DEK",
    "JURU MUDI INTERNASIONAL",
])

ENGINE_RANKS = frozenset([
    "KKM",
    "MASINIS I",
    "MASINIS II",
    "MASINIS III",
    "MASINIS IV",
    "MANDOR MESIN",
    "JURU MINYAK",
    "ELECTRICIAN",
    "FITTER",
    "KADET MESIN",
    "KADET ELECTRONIC",
    "EXTRA KKM",
    "WIPER",
    "PENGATUR MESIN",
    "OILER",
])


def get_all_onduty_seamen(
    vessel: Optional[str] = None,
    vessel_category: Optional[str] = None,
    part: Optional[str] = None,
    rank: Optional[str] = None,
    name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve active on-board seamen with optional multi-criteria filtering.

    Args:
        vessel: Optional full or partial vessel name.
        vessel_category: Optional category ('container', 'manalagi', 'bc').
        part: Optional department ('deck', 'engine').
        rank: Optional job position/rank.
        name: Optional partial seaman name or seamancode.

    Returns:
        List of dictionaries with on-duty crew member details.
    """
    df = get_seamen_as_data()
    if df.empty:
        return []

    # 1. Filter only currently active on-board seamen
    loc_series = df["last_location"].fillna("").astype(str).str.strip()
    loc_upper = loc_series.str.upper()
    status_upper = df["status"].fillna("").astype(str).str.strip().str.upper()

    is_onboard = (~loc_upper.isin(_LOKASI_OTHERS_UPPER)) & (loc_upper != "") & (status_upper != "OFF")
    filtered = df[is_onboard].copy()

    if filtered.empty:
        return []

    # Add normalized vessel name column for flexible comparisons
    filtered["norm_vessel"] = filtered["last_location"].apply(normalize_vessel_name)

    # 2. Filter by Vessel (exact or partial / fuzzy normalized)
    if vessel and vessel.strip():
        vessel_clean = vessel.strip()
        norm_query = normalize_vessel_name(vessel_clean)

        # Match exact normalized name, or substring in normalized name, or substring in raw last_location
        vessel_match = (
            (filtered["norm_vessel"] == norm_query)
            | (filtered["norm_vessel"].str.contains(norm_query, case=False, na=False))
            | (filtered["last_location"].str.contains(vessel_clean, case=False, na=False))
        )
        filtered = filtered[vessel_match]

    # 3. Filter by Vessel Category (Container, Manalagi, BC)
    if vessel_category and vessel_category.strip():
        cat_lower = vessel_category.strip().lower()
        kelompok = build_kelompok()

        target_vessels_raw = set()
        if cat_lower in ("bc", "bc_tb_tk_service"):
            for c in ["bc", "tb", "tk", "mt"]:
                target_vessels_raw.update(kelompok.get(c, []))
        elif cat_lower in kelompok:
            target_vessels_raw.update(kelompok[cat_lower])

        target_vessels = normalize_vessel_set(target_vessels_raw)
        if target_vessels:
            filtered = filtered[filtered["norm_vessel"].isin(target_vessels)]

    # 4. Filter by Department / Part (Deck or Engine)
    if part and part.strip():
        part_lower = part.strip().lower()
        pos_upper = filtered["last_position"].fillna("").astype(str).str.strip().str.upper()
        if part_lower == "deck":
            filtered = filtered[pos_upper.isin(DECK_RANKS)]
        elif part_lower == "engine":
            filtered = filtered[pos_upper.isin(ENGINE_RANKS)]

    # 5. Filter by Rank / Position
    if rank and rank.strip():
        rank_upper = rank.strip().upper()
        filtered = filtered[
            filtered["last_position"].fillna("").astype(str).str.strip().str.upper() == rank_upper
        ]

    # 6. Filter by Name or Seamancode
    if name and name.strip():
        query_str = name.strip()
        name_match = (
            filtered["name"].fillna("").astype(str).str.contains(query_str, case=False, na=False)
            | filtered["seamancode"].astype(str).str.contains(query_str, case=False, na=False)
        )
        filtered = filtered[name_match]

    # Sort results nicely: by vessel, then by rank, then by name
    filtered = filtered.sort_values(
        by=["norm_vessel", "last_position", "name"],
        ascending=True,
        na_position="last",
    )

    # 7. Build output list of dicts
    results = []
    for _, row in filtered.iterrows():
        # Handle parsed dates safely
        s_date = row.get("start_date")
        e_date = row.get("end_date")
        start_date_str = s_date.isoformat() if hasattr(s_date, "isoformat") and pd.notna(s_date) else (str(s_date) if pd.notna(s_date) else None)
        end_date_str = e_date.isoformat() if hasattr(e_date, "isoformat") and pd.notna(e_date) else (str(e_date) if pd.notna(e_date) else None)

        # Parse integers safely
        day_elapsed = 0
        try:
            day_elapsed = int(row.get("day_elapsed") or 0)
        except (ValueError, TypeError):
            day_elapsed = 0

        day_remains = 0
        try:
            day_remains = int(row.get("day_remains") or 0)
        except (ValueError, TypeError):
            day_remains = 0

        age = None
        try:
            val = row.get("age")
            if pd.notna(val) and val != "":
                age = int(float(val))
        except (ValueError, TypeError):
            age = None

        results.append({
            "seamancode": int(row["seamancode"]) if pd.notna(row.get("seamancode")) else None,
            "seafarercode": str(row["seafarercode"]) if pd.notna(row.get("seafarercode")) else None,
            "name": str(row.get("name", "")).strip(),
            "last_position": str(row.get("last_position", "")).strip(),
            "last_location": str(row.get("last_location", "")).strip(),
            "vessel_name_clean": row["norm_vessel"],
            "start_date": start_date_str,
            "end_date": end_date_str,
            "day_elapsed": day_elapsed,
            "day_remains": day_remains,
            "age": age,
            "certificate": str(row.get("certificate", "-")).strip() if pd.notna(row.get("certificate")) else "-",
            "phone_number_1": str(row.get("phone_number_1", "")) if pd.notna(row.get("phone_number_1")) else "",
            "phone_number_2": str(row.get("phone_number_2", "")) if pd.notna(row.get("phone_number_2")) else "",
            "phone_number_3": str(row.get("phone_number_3")) if pd.notna(row.get("phone_number_3")) else "",
            "phone_number_4": str(row.get("phone_number_4")) if pd.notna(row.get("phone_number_4")) else "",
            "status": str(row.get("status", "ON BOARD")),
        })

    return results

