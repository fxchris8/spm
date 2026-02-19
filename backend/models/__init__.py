"""
Models Package
Contains data structure definitions used across all layers.
Models are shared blueprints — not part of the flow, but referenced by
Services, Repositories, and Controllers as needed.
"""

from .dashboard import SeamanRecord, SimilarSeamanResult, VesselStats

__all__ = [
    # Dashboard Models
    "SeamanRecord",
    "VesselStats",
    "SimilarSeamanResult",
]
