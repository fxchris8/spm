"""
Module ini menangani operasi database untuk fitur pencarian dan rekomendasi pelaut.
"""

import pandas as pd
from sqlalchemy import text

from database.database import get_db_connection


def get_seamen_for_search():
    """
    Fetch seamen data for search/recommendation.
    Returns combined DataFrame similar to original_df.

    Returns:
        DataFrame: Seamen data with all columns needed for search
    """
    try:
        with get_db_connection() as conn:
            query = "SELECT * FROM seamen"
            df = pd.read_sql_query(text(query), conn)
            return df

    except Exception as e:
        raise Exception(f"Failed to fetch seamen data: {str(e)}")
