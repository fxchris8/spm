"""
Dashboard Service
Handles business logic and data transformation for dashboard.
"""

from repositories.dashboard_repository import get_seamen_data, get_vessels_data


def get_dashboard_data():
    """
    Get dashboard data with proper column naming and filtering.

    Returns:
        DataFrame: Processed dashboard data with renamed columns and filtered fields
    """
    # Get raw data from repository
    data = get_seamen_data()

    # Rename columns to match frontend expectations
    data = data.rename(
        columns={
            "age": "UMUR",
            "certificate": "CERTIFICATE",
            "day_remains": "DAY REMAINS",
            "last_position": "RANK",
            "last_location": "VESSEL",
            "name": "SEAMAN NAME",
            "seafarercode": "SEAFARER CODE",
            "seamancode": "SEAMAN CODE",
        }
    )

    # Filter only required columns
    data = data[
        [
            "SEAMAN CODE",
            "SEAFARER CODE",
            "SEAMAN NAME",
            "RANK",
            "VESSEL",
            "UMUR",
            "CERTIFICATE",
            "DAY REMAINS",
        ]
    ]

    return data


def get_vessel_stats():
    """
    Get vessel statistics by category (container, manalagi, bc).

    Returns:
        dict: Dictionary with count of unique vessels per category
    """
    # Get rotation vessels from repository
    rotation_vessels = get_vessels_data()

    # Count unique ships per category
    container_ships = set()
    manalagi_ships = set()
    bc_ships = set()

    for vessel in rotation_vessels:
        categorization = vessel.get("categorization", "").lower()
        groups = vessel.get("groups", {})

        # Collect all ships from all groups in this vessel
        for group_ships in groups.values():
            if categorization == "container":
                container_ships.update(group_ships)
            elif categorization == "manalagi":
                manalagi_ships.update(group_ships)
            elif categorization == "bc":
                bc_ships.update(group_ships)

    stats = {
        "container": len(container_ships),
        "manalagi": len(manalagi_ships),
        "bc": len(bc_ships),
    }

    return stats
