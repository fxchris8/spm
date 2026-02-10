"""
Sync Controller
Handles HTTP requests for manual data synchronization.
"""

from flask import jsonify

from services.sync_service import manual_sync


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
        return (
            jsonify({"status": "error", "message": f"Gagal melakukan sync: {str(e)}"}),
            500,
        )
