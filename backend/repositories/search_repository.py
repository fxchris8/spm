"""
Search Repository
Handles database operations for search functionality.
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
            print(f"DONE - Fetched {len(df)} seamen records for search")
            return df

    except Exception as e:
        print(f"FAIL - Error fetching seamen for search: {str(e)}")
        raise Exception(f"Failed to fetch seamen data: {str(e)}")
