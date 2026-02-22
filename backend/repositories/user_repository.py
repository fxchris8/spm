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
        # print(f"[ERROR] Failed to fetch user {username}: {e}")
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
        # print(f"[ERROR] Failed to fetch user by id {user_id}: {e}")
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
        # print(f"[ERROR] Failed to create user {username}: {e}")
        raise e
