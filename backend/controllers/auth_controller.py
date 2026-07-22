"""
Module ini menangani autentikasi pengguna, meliputi login, register, logout,
dan pengecekan sesi aktif. Token JWT disimpan sebagai HttpOnly cookie.
"""

import os
from urllib.parse import urlencode

from flask import jsonify, make_response, request

from services import (
    build_sso_login_url,
    get_current_user,
    is_sso_enabled,
    login_user,
    login_user_with_sso_code,
    register_user,
)

IS_PRODUCTION = os.environ.get("FLASK_ENV", "development") == "production"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")
SSO_CLIENT_ID = os.environ.get("SSO_CLIENT_ID", "").strip()


def _build_frontend_url(path, **query_params):
    base_url = f"{FRONTEND_URL}{path}" if FRONTEND_URL else path
    filtered_query = {k: v for k, v in query_params.items() if v}
    if not filtered_query:
        return base_url
    return f"{base_url}?{urlencode(filtered_query)}"


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

        response = make_response(
            jsonify({"message": "Login successful", "user": user}), 200
        )

        response.set_cookie(
            "token",
            token,
            httponly=True,
            samesite="Lax",
            secure=IS_PRODUCTION,
            max_age=6 * 60 * 60,
        )

        return response
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


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

        return (
            jsonify({"message": "User created successfully", "username": username}),
            201,
        )
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


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
            max_age=0,
        )
        return response
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


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
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def sso_initiate_controller():
    """
    Start SSO login by redirecting browser to SSO Portal frontend.
    """
    try:
        if not is_sso_enabled():
            return jsonify({"message": "SSO is not configured"}), 503

        requested_client_id = request.args.get("client_id")
        if requested_client_id and requested_client_id != SSO_CLIENT_ID:
            return jsonify({"message": "Invalid client_id"}), 400

        redirect_url = build_sso_login_url(requested_client_id)
        return make_response("", 302, {"Location": redirect_url})
    except Exception as e:
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


def sso_callback_controller():
    """
    Complete SSO callback, set local JWT cookie, then redirect to frontend.
    """
    try:
        if not is_sso_enabled():
            return jsonify({"message": "SSO is not configured"}), 503

        if request.args.get("error"):
            error_message = request.args.get("error_description") or request.args.get(
                "error"
            )
            redirect_url = _build_frontend_url("/login", sso_error=error_message)
            return make_response("", 302, {"Location": redirect_url})

        code = request.args.get("code")
        state = request.args.get("state")
        client_id = request.args.get("client_id")

        if not code or not state:
            redirect_url = _build_frontend_url(
                "/login", sso_error="Missing code or state"
            )
            return make_response("", 302, {"Location": redirect_url})

        result = login_user_with_sso_code(code, state, client_id=client_id)

        response = make_response(
            "",
            302,
            {"Location": _build_frontend_url("/auth/sso/callback", sso="success")},
        )
        response.set_cookie(
            "token",
            result["token"],
            httponly=True,
            samesite="Lax",
            secure=IS_PRODUCTION,
            max_age=6 * 60 * 60,
        )
        return response
    except ValueError as e:
        redirect_url = _build_frontend_url("/login", sso_error=str(e))
        return make_response("", 302, {"Location": redirect_url})
    except Exception as e:
        redirect_url = _build_frontend_url("/login", sso_error="SSO login failed")
        response = make_response("", 302, {"Location": redirect_url})
        response.headers["X-SSO-Error"] = str(e)
        return response
