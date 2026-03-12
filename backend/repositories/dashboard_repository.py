"""
Module ini menangani query database untuk keperluan data dashboard,
termasuk data pelaut, kapal rotasi, dan pencarian pelaut berdasarkan kode.
"""

import pandas as pd
from sqlalchemy import text

from database.database import get_db_connection


def get_seamen_data():
    """
    Retrieve raw seamen data from database using direct SQL query.

    Returns:
        DataFrame: Raw seamen data from database
    """
    query = "SELECT * FROM seamen"

    with get_db_connection() as conn:
        df = pd.read_sql_query(text(query), conn)
        return df


def get_vessels_data():
    """
    Retrieve rotation vessels data from database using direct SQL query.
    Fetches from vessels table and joins with vessels_groups and vessels_ships.

    Table structure: vessels → vessels_groups → vessels_ships

    Returns:
        list: List of rotation vessels with categorization and groups
    """
    query = """
        SELECT 
            v.id,
            v.job_title,
            v.vessel,
            v.type,
            v.part,
            v.categorization,
            v.created_at,
            v.updated_at,
            vg.group_key,
            vs.ship_name
        FROM vessels v
        LEFT JOIN vessels_groups vg ON v.id = vg.vessel_id
        LEFT JOIN vessels_ships vs ON vg.id = vs.group_id
        ORDER BY v.id, vg.group_number, vs.order_index
    """

    with get_db_connection() as conn:
        result = conn.execute(text(query))
        rows = result.fetchall()

        vessels_map = {}

        for row in rows:
            vessel_id = row[0]

            if vessel_id not in vessels_map:
                vessels_map[vessel_id] = {
                    "id": vessel_id,
                    "job_title": row[1],
                    "vessel": row[2],
                    "type": row[3],
                    "part": row[4],
                    "categorization": row[5],
                    "created_at": row[6].isoformat() if row[6] else None,
                    "updated_at": row[7].isoformat() if row[7] else None,
                    "groups": {},
                }

            group_key = row[8]
            ship_name = row[9]

            if group_key and ship_name:
                if group_key not in vessels_map[vessel_id]["groups"]:
                    vessels_map[vessel_id]["groups"][group_key] = []
                vessels_map[vessel_id]["groups"][group_key].append(ship_name)

        vessels = list(vessels_map.values())

        return vessels


def get_seaman_by_code(seaman_code):
    """
    Get seaman data by seamancode.

    Args:
        seaman_code: Seaman code to search for

    Returns:
        dict: Seaman data or None if not found
    """
    query = "SELECT * FROM seamen WHERE seamancode = :seaman_code"

    with get_db_connection() as conn:
        result = conn.execute(text(query), {"seaman_code": seaman_code})
        row = result.fetchone()

        if row:
            columns = result.keys()
            seaman_data = dict(zip(columns, row))
            return seaman_data

        return None
