"""
Dashboard Models
Defines data structures used across the dashboard feature.
"""

from dataclasses import dataclass, field
from typing import Any, List


class SeamanRecord:
    """
    Represents a single seaman's data as displayed on the dashboard.
    Column names follow the frontend naming convention.
    """

    # Column mapping from DB → frontend display name
    COLUMN_MAP: dict = {
        "age": "UMUR",
        "certificate": "CERTIFICATE",
        "day_remains": "DAY REMAINS",
        "last_position": "RANK",
        "last_location": "VESSEL",
        "name": "SEAMAN NAME",
        "seafarercode": "SEAFARER CODE",
        "seamancode": "SEAMAN CODE",
    }

    # Ordered list of columns to include in the API response
    DISPLAY_COLUMNS: list = [
        "SEAMAN CODE",
        "SEAFARER CODE",
        "SEAMAN NAME",
        "RANK",
        "VESSEL",
        "UMUR",
        "CERTIFICATE",
        "DAY REMAINS",
    ]


@dataclass
class VesselStats:
    """
    Represents the count of unique vessels per ship category.
    Used as the return type of get_vessel_stats().
    """

    container: int = 0
    manalagi: int = 0
    bc: int = 0

    def to_dict(self) -> dict:
        return {
            "container": self.container,
            "manalagi": self.manalagi,
            "bc": self.bc,
        }


@dataclass
class SimilarSeamanResult:
    """
    Represents the result of a seaman similarity search.
    Used as the return type of get_similar_seamen().
    """

    status: str  # "success" or "error"
    data: List[Any] = field(default_factory=list)
    message: str = ""  # populated on error

    def to_dict(self) -> dict:
        result = {"status": self.status}
        if self.status == "success":
            result["data"] = self.data
        else:
            result["message"] = self.message
        return result
