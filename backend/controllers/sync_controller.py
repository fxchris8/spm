"""
Module ini menangani sinkronisasi data manual dari API eksternal.
"""

from flask import jsonify

from services import manual_sync


def manual_sync_controller():
    """
    POST /api/manual-sync
    Manually trigger data sync from external API.

    Returns:
        JSON: Sync result with status, message, and timestamp
    """
    try:
        result = manual_sync()
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500
