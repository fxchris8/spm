from flask import jsonify, request

from services.auth_service import login_user, logout_user, register_user


def login_controller():
    """
    Handle login request.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing JSON body"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    try:
        response, status_code = login_user(username, password)
        return jsonify(response), status_code
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
    Handle logout request.
    """
    try:
        response, status_code = logout_user()
        return jsonify(response), status_code
    except Exception as e:
        print(f"[ERROR] Logout failed: {e}")
        return jsonify({"message": "Internal Server Error"}), 500
