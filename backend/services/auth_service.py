import datetime
import os

import bcrypt
import jwt

from repositories.user_repository import create_user, get_user_by_username

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")


def login_user(username, password):
    """
    Authenticate user and return JWT token if successful.
    """
    # 1. Get user from DB
    user = get_user_by_username(username)

    if not user:
        return {"error": "Invalid username or password"}, 401

    if not user["is_active"]:
        return {"error": "Account is inactive"}, 401

    # 2. Verify Password
    # Stored password should be a hash.
    # Note: If existing users have plain text passwords, this will fail.
    # We assume 'password' column stores bcrypt hash string.
    stored_password = user["password"]

    # Check if password matches
    if check_password(password, stored_password):
        # 3. Generate Token
        token = generate_token(user["id"], user["username"], user["role"])
        return {
            "token": token,
            "user": {
                "id": user["id"],
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
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(hours=6),  # Token expires in 6 hours
        "iat": datetime.datetime.utcnow(),
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def register_user(username, email, password, role="USER"):
    """
    Register user service (helper for seeding).
    """
    # Check if user already exists
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

        # Fetch full user data from DB to include email
        from repositories.user_repository import get_user_by_id
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
        # print("[AUTH] Token expired")
        return None
    except jwt.InvalidTokenError:
        # print("[AUTH] Invalid token")
        return None
