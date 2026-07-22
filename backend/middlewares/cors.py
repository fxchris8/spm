"""
Module ini mengkonfigurasi CORS (Cross-Origin Resource Sharing) untuk aplikasi Flask
berdasarkan environment yang aktif (production atau development).
"""

import os
import re

from flask import request
from flask_cors import CORS


def init_cors(app):
    """
    Menginisialisasi CORS pada aplikasi Flask.
    Di production, hanya mengizinkan origin dari domain spil.co.id.
    Di development, hanya mengizinkan origin dari localhost:5173.
    """
    env = os.environ.get("FLASK_ENV", "development")
    allowed_origins = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ALLOWED_ORIGINS",
            "https://pe.spil.co.id,https://px.spil.co.id,http://localhost:5173",
        ).split(",")
        if origin.strip()
    ]
    origin_patterns = [re.compile(r"^https?://([a-zA-Z0-9-]+\.)*spil\.co\.id(:\d+)?$")]

    if env != "production":
        origin_patterns.append(re.compile(r"^http://localhost:5173$"))

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [*allowed_origins, *origin_patterns],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
    )

    @app.before_request
    def handle_preflight():
        """
        Memastikan preflight request ke endpoint API tidak berakhir 404.
        """
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            return app.make_default_options_response()

    @app.after_request
    def add_headers(response):
        """
        Menambahkan header Access-Control-Allow-Private-Network ke setiap response.
        """
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response
