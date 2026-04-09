"""
Module ini menyediakan layanan autentikasi, termasuk login, registrasi, generate JWT token, dan verifikasi user.
"""

import datetime
import hashlib
import hmac
import os
import secrets
from urllib.parse import urlencode

import bcrypt
import jwt
import requests

from repositories.user_repository import (
    create_user,
    create_sso_user,
    get_user_by_sso_id,
    get_user_by_id,
    get_user_by_username,
    link_sso_id_to_user,
)

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
SSO_BASE_URL = os.environ.get("SSO_BASE_URL", "").rstrip("/")
SSO_FRONTEND_URL = os.environ.get("SSO_FRONTEND_URL", "").rstrip("/")
SSO_CLIENT_ID = os.environ.get("SSO_CLIENT_ID", "").strip()
SSO_CLIENT_SECRET = os.environ.get("SSO_CLIENT_SECRET", "").strip()
SSO_CALLBACK_URL = os.environ.get("SSO_CALLBACK_URL", "").strip()
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")
SSO_STATE_MAX_AGE_SECONDS = 10 * 60


def login_user(username, password):
    """
    Authenticate user and return JWT token if successful.
    """
    user = get_user_by_username(username)

    if not user:
        return {"error": "Invalid username or password"}, 401

    if not user["is_active"]:
        return {"error": "Account is inactive"}, 401

    stored_password = user["password"]

    if check_password(password, stored_password):
        token = generate_token(str(user["id"]), user["username"], user["role"])
        return {
            "token": token,
            "user": {
                "id": str(user["id"]),
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
            },
        }, 200
    else:
        return {"error": "Invalid username or password"}, 401


def check_password(plain_password, hashed_password):
    """
    Verify a password against a hash (using bcrypt).
    """
    if not hashed_password:
        return False

    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode("utf-8")

    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password)


def hash_password(plain_password):
    """
    Hash a password for storage (using bcrypt).
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def generate_token(user_id, username, role):
    """
    Generate JWT Token.
    """
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=6),
        "iat": datetime.datetime.utcnow(),
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def register_user(username, email, password, role="USER"):
    """
    Register user service (helper for seeding).
    """
    existing_user = get_user_by_username(username)
    if existing_user:
        return {"error": "Username already exists"}

    hashed = hash_password(password)
    return create_user(username, email, hashed, role)


def logout_user():
    """
    Logout user (Placeholder for blacklist logic if needed).
    For stateless JWT, cookie is cleared by the controller.
    """
    return {"message": "Successfully logged out"}, 200


def get_current_user(token: str):
    """
    Decode JWT token and return user info dict (including email from DB).
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")

        user = get_user_by_id(user_id)

        if not user:
            return None

        return {
            "id": str(user["id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def is_sso_enabled():
    """
    SSO is enabled only when all required env vars are configured.
    """
    return all(
        [
            SECRET_KEY,
            SSO_BASE_URL,
            SSO_FRONTEND_URL,
            SSO_CLIENT_ID,
            SSO_CLIENT_SECRET,
            SSO_CALLBACK_URL,
            FRONTEND_URL,
        ]
    )


def generate_sso_state():
    """
    Generate stateless HMAC-signed state token.
    """
    timestamp = str(int(datetime.datetime.utcnow().timestamp() * 1000))
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        timestamp.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{timestamp}.{signature}"


def validate_sso_state(state):
    """
    Validate HMAC signature and age of the SSO state token.
    """
    try:
        timestamp, provided_signature = state.split(".", 1)
        expected_signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            timestamp.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(provided_signature, expected_signature):
            return False

        issued_at = int(timestamp)
        now = int(datetime.datetime.utcnow().timestamp() * 1000)
        age_seconds = (now - issued_at) / 1000
        return 0 <= age_seconds <= SSO_STATE_MAX_AGE_SECONDS
    except (ValueError, TypeError, AttributeError):
        return False


def build_sso_login_url(client_id=None):
    """
    Build SSO frontend login URL with OAuth query params.
    """
    resolved_client_id = client_id or SSO_CLIENT_ID
    state = generate_sso_state()
    query = urlencode(
        {
            "client_id": resolved_client_id,
            "redirect_uri": SSO_CALLBACK_URL,
            "response_type": "code",
            "state": state,
        }
    )
    return f"{SSO_FRONTEND_URL}/login?{query}"


def exchange_sso_code_for_token(code, client_id=None):
    """
    Exchange authorization code for OAuth access token.
    """
    resolved_client_id = client_id or SSO_CLIENT_ID
    response = requests.post(
        f"{SSO_BASE_URL}/api/v1/oauth/token",
        json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SSO_CALLBACK_URL,
            "client_id": resolved_client_id,
            "client_secret": SSO_CLIENT_SECRET,
        },
        timeout=15,
    )

    response.raise_for_status()
    payload = response.json()
    data = payload.get("data", payload)
    access_token = data.get("access_token")

    if not access_token:
        raise ValueError("Missing access token from SSO response")

    return access_token


def fetch_sso_userinfo(access_token):
    """
    Retrieve authenticated user profile from SSO Portal.
    """
    response = requests.get(
        f"{SSO_BASE_URL}/api/v1/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    data = payload.get("data", payload)

    if not data or not data.get("id") or not data.get("username"):
        raise ValueError("Incomplete userinfo response from SSO")

    return data


def _generate_unusable_password():
    """
    Generate a random password hash for SSO-created users.
    """
    return hash_password(secrets.token_urlsafe(32))


def find_or_create_sso_user(sso_user):
    """
    Link SSO account to local user or create a new local user.
    """
    sso_id = str(sso_user["id"])
    username = sso_user["username"]
    email = sso_user.get("email")
    role = sso_user.get("role", "USER")

    user = get_user_by_sso_id(sso_id)
    if user:
        return {
            "id": str(user["id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        }

    existing_user = get_user_by_username(username)
    if existing_user:
        linked_user = link_sso_id_to_user(existing_user["id"], sso_id)
        user = linked_user or existing_user
        return {
            "id": str(user["id"]),
            "username": user["username"],
            "email": user.get("email"),
            "role": user["role"],
        }

    created_user = create_sso_user(
        username=username,
        email=email,
        password_hash=_generate_unusable_password(),
        role=role,
        sso_id=sso_id,
        is_active=True,
    )
    return {
        "id": str(created_user["id"]),
        "username": created_user["username"],
        "email": created_user.get("email"),
        "role": created_user["role"],
    }


def login_user_with_sso_code(code, state, client_id=None):
    """
    Complete SSO login callback and return local JWT plus local user info.
    """
    if not is_sso_enabled():
        raise RuntimeError("SSO is not configured")

    if not validate_sso_state(state):
        raise ValueError("State parameter tidak valid")

    if client_id and client_id != SSO_CLIENT_ID:
        raise ValueError("Client ID tidak sesuai konfigurasi aplikasi")

    access_token = exchange_sso_code_for_token(code, client_id=client_id)
    sso_user = fetch_sso_userinfo(access_token)
    local_user = find_or_create_sso_user(sso_user)
    token = generate_token(
        local_user["id"], local_user["username"], local_user["role"]
    )

    return {"token": token, "user": local_user}
