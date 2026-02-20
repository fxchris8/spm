from flask import Blueprint

from controllers.auth_controller import (
    login_controller,
    logout_controller,
    register_controller,
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    return login_controller()


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    return register_controller()


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    return logout_controller()
