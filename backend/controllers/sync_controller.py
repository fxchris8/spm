"""
Module ini menangani sinkronisasi data manual dari API eksternal.
"""

from flask import jsonify

from services import manual_sync, sync_ship_particular


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


def sync_ship_particular_controller():
    """
    POST /api/ship-particular/sync
    Manually trigger ship particular sync from external API.

    Returns:
        JSON: Sync result with status, message, records_synced, and timestamp
    """
    try:
        result = sync_ship_particular()
        status_code = 200 if result.get("status") == "success" else 500
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500

