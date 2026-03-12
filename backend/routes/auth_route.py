"""
Module ini mendefinisikan route Blueprint untuk autentikasi pengguna,
meliputi login, register, logout, dan pengecekan sesi aktif.
"""

from flask import Blueprint

from controllers.auth_controller import (
    login_controller,
    logout_controller,
    me_controller,
    register_controller,
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """
    POST /api/auth/login — Autentikasi pengguna dan set HttpOnly cookie.
    """
    return login_controller()


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """
    POST /api/auth/register — Membuat akun pengguna baru.
    """
    return register_controller()


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """
    POST /api/auth/logout — Menghapus HttpOnly cookie dan mengakhiri sesi.
    """
    return logout_controller()


@auth_bp.route("/auth/me", methods=["GET"])
def me():
    """
    GET /api/auth/me — Mengembalikan data pengguna dari sesi aktif.
    """
    return me_controller()
