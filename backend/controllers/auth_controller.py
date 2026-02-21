import os

from flask import jsonify, make_response, request

from services import get_current_user, login_user, logout_user, register_user

IS_PRODUCTION = os.environ.get("FLASK_ENV", "development") == "production"


def login_controller():
    """
    Handle login request. Sets HttpOnly cookie on success.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing JSON body"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        result, status_code = login_user(username, password)

        if status_code != 200:
            return jsonify(result), status_code

        token = result.get("token")
        user = result.get("user")

        # Build response — return user info but NOT the token
        response = make_response(jsonify({"message": "Login successful", "user": user}), 200)

        # Set HttpOnly cookie (not accessible via JS)
        response.set_cookie(
            "token",
            token,
            httponly=True,
            samesite="Lax",
            secure=IS_PRODUCTION,  # True in production (HTTPS only)
            max_age=6 * 60 * 60,  # 6 hours, matches JWT expiry
        )

        return response
    except Exception as e:
        print(f"[ERROR] Login failed: {e}")
        return jsonify({"message": "Internal Server Error"}), 500


def register_controller():
    """
    Handle register request (Optional, for admin usage).
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing JSON body"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "USER")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        result = register_user(username, email, password, role)
        if "error" in result:
            return jsonify(result), 400

        # Convert result row to dict if needed (SQLAlchemy Row)
        return (
            jsonify({"message": "User created successfully", "username": username}),
            201,
        )
    except Exception as e:
        print(f"[ERROR] Register failed: {e}")
        return jsonify({"message": "Internal Server Error"}), 500


def logout_controller():
    """
    Handle logout request. Clears the HttpOnly cookie.
    """
    try:
        response = make_response(jsonify({"message": "Successfully logged out"}), 200)
        response.set_cookie(
            "token",
            "",
            httponly=True,
            samesite="Lax",
            secure=IS_PRODUCTION,
            max_age=0,  # Immediately expire
        )
        return response
    except Exception as e:
        print(f"[ERROR] Logout failed: {e}")
        return jsonify({"message": "Internal Server Error"}), 500


def me_controller():
    """
    Return current user info from cookie. Used by frontend to restore session.
    """
    try:
        token = request.cookies.get("token")

        if not token:
            return jsonify({"message": "Not authenticated"}), 401

        user = get_current_user(token)
        if not user:
            return jsonify({"message": "Invalid or expired token"}), 401

        return jsonify({"user": user}), 200
    except Exception as e:
        print(f"[ERROR] Me endpoint failed: {e}")
        return jsonify({"message": "Internal Server Error"}), 500
