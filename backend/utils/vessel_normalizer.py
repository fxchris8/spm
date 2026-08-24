"""
Module for normalizing vessel names and flexible matching between
seaman last_location, database vessel configurations, and central ship particulars.
"""

import re
from typing import Iterable, Set, Dict, Any
import pandas as pd

# Regex pattern to match common ship prefixes
# Handles variations with and without dot, followed by space(s)
_PREFIX_PATTERN = re.compile(
    r"^(KM\.?|TB\.?|MT\.?|TK\.?|BC\.?|MV\.?|KMP\.?|BG\.?|KL\.?|SERVICE\s+BOAT|SERVICE)\s+",
    flags=re.IGNORECASE,
)

# Canonical alias mapping for spelling variations between legacy input and master ship_particular
_VESSEL_ALIASES = {
    "MULIANIM": "MULI ANIM",
    "MULI ANIM": "MULI ANIM",
    "ORIENTAL SAMUDERA": "ORIENTAL SAMUDRA",
    "ORIENTAL SAMUDRA": "ORIENTAL SAMUDRA",
    "TENYO MARU": "TENYO",
    "TENYO": "TENYO",
    "ALPA SATU": "ALPHA",
    "ALPHA SATU": "ALPHA",
    "ALPHA": "ALPHA",
    "NELLY A 100": "NELLY A100",
    "NELLY A100": "NELLY A100",
    "SPIL RAHAYU": "SPIL HAYU",
    "SPIL HAYU": "SPIL HAYU",
}


def normalize_vessel_name(name: Any) -> str:
    """
    Strip ship type prefixes (KM., TB., MT., TK., BC., MV., etc.)
    and return normalized uppercase plain name for flexible comparison.

    Examples:
        - "KM. MERATUS JAYAPURA" -> "MERATUS JAYAPURA"
        - "KM MERATUS JAYAPURA"  -> "MERATUS JAYAPURA"
        - "TB. ALPHA"            -> "ALPHA"
        - "KM. MULIANIM"         -> "MULI ANIM"
        - "KM. ORIENTAL SAMUDERA"-> "ORIENTAL SAMUDRA"
        - "BC. TENYO MARU"       -> "TENYO"
        - "DARAT"                -> "DARAT"
    """
    if name is None or pd.isna(name):
        return ""

    name_str = str(name).strip()
    if not name_str:
        return ""

    # Strip prefix using regex
    cleaned = _PREFIX_PATTERN.sub("", name_str).strip()

    # Collapse any multi-spaces
    cleaned = re.sub(r"\s+", " ", cleaned).upper()

    # Resolve known canonical alias if present
    cleaned = _VESSEL_ALIASES.get(cleaned, cleaned)

    return cleaned


def is_vessel_match(name1: Any, name2: Any) -> bool:
    """
    Check if two vessel names match, either via exact comparison or normalized comparison.
    """
    if name1 is None or name2 is None or pd.isna(name1) or pd.isna(name2):
        return False

    s1 = str(name1).strip().upper()
    s2 = str(name2).strip().upper()

    if not s1 or not s2:
        return False

    if s1 == s2:
        return True

    n1 = normalize_vessel_name(name1)
    n2 = normalize_vessel_name(name2)

    return bool(n1 and n2 and n1 == n2)


def normalize_vessel_set(names: Iterable[Any]) -> Set[str]:
    """
    Create a set of normalized vessel names from an iterable.
    """
    normalized_set = set()
    for name in names:
        if name is not None and not pd.isna(name):
            norm = normalize_vessel_name(name)
            if norm:
                normalized_set.add(norm)
    return normalized_set


def build_normalized_vessel_lookup(names: Iterable[Any]) -> Dict[str, str]:
    """
    Build a mapping of normalized vessel names to their original configured name.
    """
    lookup = {}
    for name in names:
        if name is not None and not pd.isna(name):
            orig = str(name).strip()
            norm = normalize_vessel_name(orig)
            if norm:
                lookup[norm] = orig
    return lookup
