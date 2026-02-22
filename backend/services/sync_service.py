"""
Sync Service
Handles business logic for manual data synchronization.
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
        # print(f"[MANUAL SYNC] Started at {datetime.now()}")

        # Fetch and sync seamen data
        # print("[MANUAL SYNC] Syncing seamen data...")
        seamen_df = fetch_seamen_from_api()
        if seamen_df is not None:
            sync_seamen_to_database(seamen_df)
        else:
            pass  # print("[MANUAL SYNC] Failed to fetch seamen data")

        # Fetch and sync mutations data
        # print("[MANUAL SYNC] Syncing mutations data...")
        mutations_df = fetch_mutations_from_api()
        if mutations_df is not None:
            sync_mutations_to_database(mutations_df)
        else:
            pass  # print("[MANUAL SYNC] Failed to fetch mutations data")

        # print(f"[MANUAL SYNC] Completed at {datetime.now()}")

        return {
            "status": "success",
            "message": "Data berhasil di-sync dari API pusat",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        # print(f"[MANUAL SYNC ERROR] {str(e)}")
        raise Exception(f"Failed to sync data: {str(e)}")
