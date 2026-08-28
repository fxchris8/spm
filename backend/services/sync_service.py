"""
Module ini menyediakan business logic untuk sinkronisasi data secara manual dari API eksternal ke database.
"""

from datetime import datetime

from repositories import (
    fetch_mutations_from_api,
    fetch_seamen_from_api,
    fetch_ship_particular_from_api,
    sync_mutations_to_database,
    sync_seamen_to_database,
    sync_ship_particular_to_database,
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

        ship_particular_df = fetch_ship_particular_from_api()
        if ship_particular_df is not None:
            sync_ship_particular_to_database(ship_particular_df)
        else:
            pass

        return {
            "status": "success",
            "message": "Data berhasil di-sync dari API pusat",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise Exception(f"Failed to sync data: {str(e)}")


def sync_ship_particular():
    """
    Sinkronisasi data Ship Particular dari API Pusat ke database lokal.
    Fetch semua data dari API kemudian truncate+insert ke tabel ship_particular.

    Returns:
        dict: Status sync dengan jumlah record dan timestamp
    """
    try:
        df = fetch_ship_particular_from_api()

        if df is not None:
            success = sync_ship_particular_to_database(df)
            record_count = len(df) if success else 0
        else:
            success = False
            record_count = 0

        return {
            "status": "success" if success else "failed",
            "message": (
                f"Ship Particular berhasil di-sync: {record_count} kapal"
                if success
                else "Gagal sync Ship Particular dari API"
            ),
            "records_synced": record_count,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise Exception(f"Failed to sync ship particular: {str(e)}")

