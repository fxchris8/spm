"""
Module ini mengkonfigurasi CORS (Cross-Origin Resource Sharing) untuk aplikasi Flask
berdasarkan environment yang aktif (production atau development).
"""

import os

from flask_cors import CORS


def init_cors(app):
    """
    Menginisialisasi CORS pada aplikasi Flask.
    Di production, hanya mengizinkan origin dari domain spil.co.id.
    Di development, hanya mengizinkan origin dari localhost:5173.
    """
    ENV = os.environ.get("FLASK_ENV", "development")

    if ENV == "production":
        CORS(
            app,
            resources={
                r"/*": {
                    "origins": [
                        r"http://.*\.spil\.co\.id(:\d+)?",
                        r"https://.*\.spil\.co\.id(:\d+)?",
                    ],
                    "supports_credentials": True,
                }
            },
        )
    else:
        CORS(
            app,
            resources={
                r"/*": {
                    "origins": "http://localhost:5173",
                    "supports_credentials": True,
                }
            },
        )

    @app.after_request
    def add_headers(response):
        """
        Menambahkan header Access-Control-Allow-Private-Network ke setiap response.
        """
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response
