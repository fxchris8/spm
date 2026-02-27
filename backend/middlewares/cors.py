import os

from flask_cors import CORS

ALLOWED_ORIGINS = [
    r"https?://.*\.spil\.co\.id(:\d+)?",  # All subdomains of spil.co.id (incl. pe.spil.co.id)
    r"https?://spil\.co\.id(:\d+)?",  # Main spil.co.id domain
]


def init_cors(app):
    """
    Initialize CORS for the Flask app.
    - Production : hanya izinkan domain spil.co.id dan subdomainnya
    - Development: izinkan localhost:5173 dengan credentials (HttpOnly cookies)
    """
    ENV = os.environ.get("FLASK_ENV", "development")

    if ENV == "production":
        CORS(
            app=app,
            resources={
                r"/spm-backend/api/*": {
                    "origins": ALLOWED_ORIGINS,
                    "supports_credentials": True,
                }
            },
        )
    else:
        CORS(
            app=app,
            resources={
                r"/api/*": {
                    "origins": "http://localhost:5173",
                    "supports_credentials": True,
                }
            },
        )

    @app.after_request
    def add_cors_headers(response):
        """
        Add CORS headers to all responses.
        Required for Private Network Access (PNA) in modern browsers.
        """
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response
