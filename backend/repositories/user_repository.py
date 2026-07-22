"""
Module ini menangani operasi database untuk manajemen pengguna,
meliputi pencarian dan pembuatan akun pengguna.
"""

from functools import lru_cache

from sqlalchemy import text

from database.database import engine


def get_user_by_username(username):
    """
    Fetch user by username from the database.
    """
    try:
        query = text(
            """
            SELECT id, username, email, password, role, is_active 
            FROM users 
            WHERE username = :username
        """
        )

        with engine.connect() as conn:
            result = conn.execute(query, {"username": username}).mappings().first()
            return result
    except Exception as e:
        raise e


def get_user_by_id(user_id):
    """
    Fetch user by id (UUID) from the database.
    """
    try:
        query = text(
            """
            SELECT id, username, email, role, is_active
            FROM users
            WHERE id = :user_id
        """
        )

        with engine.connect() as conn:
            result = conn.execute(query, {"user_id": user_id}).mappings().first()
            return result
    except Exception as e:
        raise e


@lru_cache(maxsize=1)
def has_sso_id_column():
    """
    Check whether users table already has sso_id column.
    """
    try:
        query = text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'sso_id'
            LIMIT 1
        """
        )

        with engine.connect() as conn:
            result = conn.execute(query).first()
            return result is not None
    except Exception:
        return False


def get_user_by_sso_id(sso_id):
    """
    Fetch user by sso_id when the column is available.
    """
    if not has_sso_id_column():
        return None

    try:
        query = text(
            """
            SELECT id, username, email, password, role, is_active, sso_id
            FROM users
            WHERE sso_id = :sso_id
        """
        )

        with engine.connect() as conn:
            result = conn.execute(query, {"sso_id": sso_id}).mappings().first()
            return result
    except Exception as e:
        raise e


def link_sso_id_to_user(user_id, sso_id):
    """
    Link an existing local user with an SSO user id.
    """
    if not has_sso_id_column():
        return get_user_by_id(user_id)

    try:
        query = text(
            """
            UPDATE users
            SET sso_id = :sso_id
            WHERE id = :user_id
            RETURNING id, username, email, role, is_active, sso_id
        """
        )

        with engine.connect() as conn:
            result = (
                conn.execute(query, {"user_id": user_id, "sso_id": sso_id})
                .mappings()
                .first()
            )
            conn.commit()
            return result
    except Exception as e:
        raise e


def create_user(username, email, password_hash, role="USER", is_active=True):
    """
    Create a new user in the database.
    """
    try:
        query = text(
            """
            INSERT INTO users (username, email, password, role, is_active)
            VALUES (:username, :email, :password, :role, :is_active)
            RETURNING id, username, email, role
        """
        )

        with engine.connect() as conn:
            result = (
                conn.execute(
                    query,
                    {
                        "username": username,
                        "email": email,
                        "password": password_hash,
                        "role": role,
                        "is_active": is_active,
                    },
                )
                .mappings()
                .first()
            )
            conn.commit()
            return result
    except Exception as e:
        raise e


def create_sso_user(
    username, email, password_hash, role="USER", sso_id=None, is_active=True
):
    """
    Create a user for SSO login, using sso_id when schema supports it.
    """
    try:
        if has_sso_id_column():
            query = text(
                """
                INSERT INTO users (username, email, password, role, is_active, sso_id)
                VALUES (:username, :email, :password, :role, :is_active, :sso_id)
                RETURNING id, username, email, role, is_active, sso_id
            """
            )
            params = {
                "username": username,
                "email": email,
                "password": password_hash,
                "role": role,
                "is_active": is_active,
                "sso_id": sso_id,
            }
        else:
            query = text(
                """
                INSERT INTO users (username, email, password, role, is_active)
                VALUES (:username, :email, :password, :role, :is_active)
                RETURNING id, username, email, role, is_active
            """
            )
            params = {
                "username": username,
                "email": email,
                "password": password_hash,
                "role": role,
                "is_active": is_active,
            }

        with engine.connect() as conn:
            result = conn.execute(query, params).mappings().first()
            conn.commit()
            return result
    except Exception as e:
        raise e
