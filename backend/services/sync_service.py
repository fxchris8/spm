"""
Module ini menyediakan business logic untuk sinkronisasi data secara manual dari API eksternal ke database.
"""

from datetime import datetime

from repositories import (
    fetch_mutations_from_api,
    fetch_seamen_from_api,
    sync_mutations_to_database,
    sync_seamen_to_database,
)


def manual_sync():
    """
    Manually trigger data sync from external API to database.
    Fetches data from external API and syncs to database.

    Returns:
        dict: Sync result with status, message, and timestamp
    """
    try:
        seamen_df = fetch_seamen_from_api()
        if seamen_df is not None:
            sync_seamen_to_database(seamen_df)
        else:
            pass

        mutations_df = fetch_mutations_from_api()
        if mutations_df is not None:
            sync_mutations_to_database(mutations_df)
        else:
            pass

        return {
            "status": "success",
            "message": "Data berhasil di-sync dari API pusat",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise Exception(f"Failed to sync data: {str(e)}")
