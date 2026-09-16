"""
Automated unit & integration tests for role settings and rotation vessel type resolution.
Verifies:
1. 4/4 split canonical defaults & case normalization.
2. Idempotent table ensure & transaction ownership (no premature commit on caller's conn).
3. Fail-closed behavior (RoleIntegrityError raised on missing/corrupted rows, no fallback to defaults).
4. Invariant enforcement (rejecting moves that leave < 1 senior or junior role with HTTP 409).
5. Pre-commit reads (no DB reads after transaction commit).
6. Atomic rotation vessel create/update with single-transaction role locking.
7. Proper HTTP error classification and sanitization (no raw SQL leaked, 400 for input, 409 for invariant, 503 for integrity).
"""

import unittest
from unittest.mock import MagicMock, patch, call

from repositories.role_repository import (
    DEFAULT_ROLE_SETTINGS,
    VALID_CATEGORIES,
    VALID_POSITIONS,
    CANONICAL_POSITION_MAP,
    RoleIntegrityError,
    ensure_role_settings_table,
    get_position_classification,
    save_role_setting,
    reset_role_settings,
    get_all_role_settings,
    _reset_table_ensured_flag,
)
from database.connection import (
    create_rotation_vessel,
    update_rotation_vessel,
    create_rotation_vessel_with_role,
    update_rotation_vessel_with_role,
)


class TestRoleSettingsConstants(unittest.TestCase):
    def test_canonical_4_4_defaults(self):
        """Verify production backward-compatibility: all 3 categories have 4 senior, 4 junior."""
        for cat in ("container", "manalagi", "bc"):
            self.assertIn(cat, DEFAULT_ROLE_SETTINGS)
            roles = DEFAULT_ROLE_SETTINGS[cat]
            senior_positions = [pos for pos, r in roles.items() if r == "senior"]
            junior_positions = [pos for pos, r in roles.items() if r == "junior"]

            self.assertEqual(len(senior_positions), 4, f"{cat} must have exactly 4 senior positions")
            self.assertEqual(len(junior_positions), 4, f"{cat} must have exactly 4 junior positions")

            # Check exact senior positions
            self.assertCountEqual(
                senior_positions,
                ["nakhoda", "KKM", "mualimI", "masinisII"],
                f"Senior positions in {cat} must match production seeder",
            )
            # Check exact junior positions
            self.assertCountEqual(
                junior_positions,
                ["mualimII", "mualimIII", "masinisIII", "masinisIV"],
                f"Junior positions in {cat} must match production seeder",
            )

    def test_canonical_position_mapping(self):
        """Verify case normalization maps any casing to canonical symbol."""
        self.assertEqual(CANONICAL_POSITION_MAP["kkm"], "KKM")
        self.assertEqual(CANONICAL_POSITION_MAP["mualimi"], "mualimI")
        self.assertEqual(CANONICAL_POSITION_MAP["masinisii"], "masinisII")
        self.assertEqual(CANONICAL_POSITION_MAP["nakhoda"], "nakhoda")
        self.assertEqual(CANONICAL_POSITION_MAP["masinisiv"], "masinisIV")

    def test_valid_categories(self):
        self.assertEqual(VALID_CATEGORIES, {"container", "manalagi", "bc"})


class TestRoleRepositoryLogic(unittest.TestCase):
    def setUp(self):
        _reset_table_ensured_flag()

    def test_ensure_role_settings_table_does_not_commit_caller_conn(self):
        """When caller provides an existing connection, ensure_role_settings_table must NOT commit."""
        mock_conn = MagicMock()
        ensure_role_settings_table(conn=mock_conn)
        mock_conn.commit.assert_not_called()
        self.assertTrue(mock_conn.execute.called)

    @patch("repositories.role_repository.get_db_connection")
    def test_get_position_classification_invalid_input(self, mock_get_conn):
        """Invalid position or category must raise ValueError immediately."""
        with self.assertRaises(ValueError):
            get_position_classification("unknown_cat", "nakhoda")

        with self.assertRaises(ValueError):
            get_position_classification("container", "unknown_pos")

    @patch("repositories.role_repository.get_db_connection")
    def test_get_position_classification_fail_closed_on_missing_db_row(self, mock_get_conn):
        """If row is missing in database, must raise RoleIntegrityError and NOT return defaults."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        mock_conn.execute.return_value.fetchone.return_value = None

        with self.assertRaises(RoleIntegrityError):
            get_position_classification("container", "mualimI")

    @patch("repositories.role_repository.get_db_connection")
    def test_get_position_classification_returns_db_value(self, mock_get_conn):
        """Classification returns value from DB when present."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        mock_conn.execute.return_value.fetchone.return_value = ("junior",)

        classification = get_position_classification("container", "mualimI")
        self.assertEqual(classification, "junior")

    @patch("repositories.role_repository.get_db_connection")
    def test_get_all_role_settings_fail_closed_on_missing_positions(self, mock_get_conn):
        """If database returns incomplete positions for a category, raise RoleIntegrityError."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        # Only 2 rows returned instead of 24
        mock_conn.execute.return_value.fetchall.return_value = [
            ("container", "nakhoda", "senior"),
            ("container", "KKM", "senior"),
        ]

        with self.assertRaises(RoleIntegrityError) as ctx:
            get_all_role_settings()
        self.assertIn("Corrupted role_settings", str(ctx.exception))

    @patch("repositories.role_repository.get_db_connection")
    def test_get_all_role_settings_fail_closed_on_invalid_role_type(self, mock_get_conn):
        """If any row contains an invalid role_type (not senior/junior), raise RoleIntegrityError."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        rows = []
        for cat in ("container", "manalagi", "bc"):
            for pos, role in DEFAULT_ROLE_SETTINGS[cat].items():
                rows.append((cat, pos, role))
        # Corrupt one position's role_type
        rows[0] = ("container", "nakhoda", "corrupted_role")
        mock_conn.execute.return_value.fetchall.return_value = rows

        with self.assertRaises(RoleIntegrityError) as ctx:
            get_all_role_settings()
        self.assertIn("invalid role_type", str(ctx.exception))

    @patch("repositories.role_repository.get_db_connection")
    def test_get_all_role_settings_fail_closed_on_zero_senior(self, mock_get_conn):
        """If a category has all junior positions, raise RoleIntegrityError."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        rows = []
        for cat in ("container", "manalagi", "bc"):
            for pos, role in DEFAULT_ROLE_SETTINGS[cat].items():
                # Make all positions in container junior
                r = "junior" if cat == "container" else role
                rows.append((cat, pos, r))
        mock_conn.execute.return_value.fetchall.return_value = rows

        with self.assertRaises(RoleIntegrityError) as ctx:
            get_all_role_settings()
        self.assertIn("has no Senior positions", str(ctx.exception))

    @patch("repositories.role_repository.get_db_connection")
    def test_get_all_role_settings_fail_closed_on_zero_junior(self, mock_get_conn):
        """If a category has all senior positions, raise RoleIntegrityError."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        rows = []
        for cat in ("container", "manalagi", "bc"):
            for pos, role in DEFAULT_ROLE_SETTINGS[cat].items():
                # Make all positions in container senior
                r = "senior" if cat == "container" else role
                rows.append((cat, pos, r))
        mock_conn.execute.return_value.fetchall.return_value = rows

        with self.assertRaises(RoleIntegrityError) as ctx:
            get_all_role_settings()
        self.assertIn("has no Junior positions", str(ctx.exception))

    @patch("repositories.role_repository.get_db_connection")
    def test_save_role_setting_minimum_guard_senior(self, mock_get_conn):
        """Cannot move the last senior role to junior (must raise ValueError)."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        mock_rows = [
            ("nakhoda", "junior"),
            ("KKM", "senior"),
            ("mualimI", "junior"),
            ("masinisII", "junior"),
            ("mualimII", "junior"),
            ("mualimIII", "junior"),
            ("masinisIII", "junior"),
            ("masinisIV", "junior"),
        ]
        mock_conn.execute.return_value.fetchall.return_value = mock_rows

        with self.assertRaises(ValueError) as ctx:
            save_role_setting("container", "KKM", "junior")
        self.assertIn("minimal harus memiliki 1 posisi perwira", str(ctx.exception))
        mock_conn.rollback.assert_called()

    @patch("repositories.role_repository.get_db_connection")
    def test_save_role_setting_minimum_guard_junior(self, mock_get_conn):
        """Cannot move the last junior role to senior (must raise ValueError)."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        mock_rows = [
            ("nakhoda", "senior"),
            ("KKM", "senior"),
            ("mualimI", "senior"),
            ("masinisII", "senior"),
            ("mualimII", "junior"),
            ("mualimIII", "senior"),
            ("masinisIII", "senior"),
            ("masinisIV", "senior"),
        ]
        mock_conn.execute.return_value.fetchall.return_value = mock_rows

        with self.assertRaises(ValueError) as ctx:
            save_role_setting("container", "mualimII", "senior")
        self.assertIn("minimal harus memiliki 1 posisi perwira", str(ctx.exception))
        mock_conn.rollback.assert_called()

    @patch("repositories.role_repository.get_db_connection")
    def test_save_role_setting_pre_commit_read(self, mock_get_conn):
        """save_role_setting queries state and commits once without post-commit reads."""
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn

        lock_rows = [
            ("nakhoda", "senior"),
            ("KKM", "senior"),
            ("mualimI", "senior"),
            ("masinisII", "senior"),
            ("mualimII", "junior"),
            ("mualimIII", "junior"),
            ("masinisIII", "junior"),
            ("masinisIV", "junior"),
        ]
        all_rows = []
        for cat in ("container", "manalagi", "bc"):
            for pos, role in lock_rows:
                all_rows.append((cat, pos, role))

        mock_conn.execute.return_value.fetchall.side_effect = [lock_rows, all_rows]

        res = save_role_setting("container", "mualimI", "junior")
        self.assertIn("container", res)

        # Ensure commit was called
        mock_conn.commit.assert_called_once()

    def test_get_position_classification_for_update_syntax(self):
        """When for_update=True, query must include FOR UPDATE locking clause."""
        mock_conn = MagicMock()
        mock_conn.execute.return_value.fetchone.return_value = ("senior",)

        classification = get_position_classification(
            categorization="container",
            position="KKM",
            conn=mock_conn,
            for_update=True,
        )
        self.assertEqual(classification, "senior")
        executed_query = str(mock_conn.execute.call_args[0][0])
        self.assertIn("FOR UPDATE", executed_query)


class TestAtomicVesselWithRole(unittest.TestCase):
    @patch("database.connection.engine.connect")
    def test_create_rotation_vessel_with_role_atomic_success(self, mock_connect):
        """create_rotation_vessel_with_role locks role_settings and inserts vessel in single transaction."""
        mock_conn = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_conn
        mock_trans = MagicMock()
        mock_conn.begin.return_value = mock_trans

        # Mock role_settings row lookup -> "senior"
        mock_conn.execute.return_value.fetchone.side_effect = [
            ("senior",),  # role_settings SELECT FOR UPDATE
            (101,),       # vessels RETURNING id
            (201,),       # vessels_groups RETURNING id
        ]

        result = create_rotation_vessel_with_role(
            job_title="mualimI",
            vessel="D",
            part="deck",
            groups={"group1": ["KM. SHIP 1"]},
            categorization="container",
        )

        self.assertTrue(result["success"])
        self.assertEqual(result["id"], 101)
        self.assertEqual(result["type"], "senior")
        mock_trans.commit.assert_called_once()
        mock_trans.rollback.assert_not_called()

    @patch("database.connection.engine.connect")
    def test_create_rotation_vessel_fails_closed_when_role_missing(self, mock_connect):
        """If position role row missing in database, rolls back and raises RoleIntegrityError."""
        mock_conn = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_conn
        mock_trans = MagicMock()
        mock_conn.begin.return_value = mock_trans

        mock_conn.execute.return_value.fetchone.return_value = None

        with self.assertRaises(RoleIntegrityError):
            create_rotation_vessel_with_role(
                job_title="mualimI",
                vessel="D",
                part="deck",
                groups={"group1": ["KM. SHIP 1"]},
                categorization="container",
            )

        mock_trans.rollback.assert_called_once()
        mock_trans.commit.assert_not_called()

    @patch("database.connection.engine.connect")
    def test_update_rotation_vessel_with_role_atomic_success(self, mock_connect):
        """update_rotation_vessel_with_role locks role_settings and updates vessel in single transaction."""
        mock_conn = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_conn
        mock_trans = MagicMock()
        mock_conn.begin.return_value = mock_trans

        mock_conn.execute.return_value.fetchone.side_effect = [
            ("junior",),  # role_settings SELECT FOR UPDATE
            (101,),       # vessels SELECT id FOR UPDATE
            (201,),       # vessels_groups RETURNING id
        ]

        result = update_rotation_vessel_with_role(
            vessel_id=101,
            job_title="mualimII",
            vessel="E",
            part="deck",
            groups={"group1": ["KM. SHIP 2"]},
            categorization="container",
        )

        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "junior")
        mock_trans.commit.assert_called_once()
        mock_trans.rollback.assert_not_called()

    @patch("database.connection.create_rotation_vessel_with_role")
    def test_create_rotation_vessel_wrapper_delegation(self, mock_create_with_role):
        """create_rotation_vessel delegates to create_rotation_vessel_with_role, ignoring passed rotation_type."""
        mock_create_with_role.return_value = {"success": True, "id": 77, "type": "senior"}

        res = create_rotation_vessel(
            job_title="mualimI",
            vessel="D",
            rotation_type="junior",  # Conflicting passed value
            part="deck",
            groups={"group1": ["KM. SHIP 1"]},
            categorization="container",
        )
        self.assertEqual(res["id"], 77)
        mock_create_with_role.assert_called_once_with(
            job_title="mualimI",
            vessel="D",
            part="deck",
            groups={"group1": ["KM. SHIP 1"]},
            categorization="container",
        )

    @patch("database.connection.update_rotation_vessel_with_role")
    def test_update_rotation_vessel_wrapper_delegation(self, mock_update_with_role):
        """update_rotation_vessel delegates to update_rotation_vessel_with_role, ignoring passed rotation_type."""
        mock_update_with_role.return_value = {"success": True, "type": "senior"}

        res = update_rotation_vessel(
            vessel_id=99,
            job_title="KKM",
            vessel="D",
            rotation_type="junior",  # Conflicting passed value
            part="engine",
            groups={"group1": ["KM. SHIP 1"]},
            categorization="container",
            group_key_renames={"old_group": "new_group"},
        )
        self.assertTrue(res["success"])
        mock_update_with_role.assert_called_once_with(
            vessel_id=99,
            job_title="KKM",
            vessel="D",
            part="engine",
            groups={"group1": ["KM. SHIP 1"]},
            categorization="container",
            group_key_renames={"old_group": "new_group"},
        )


class TestAppEndpoints(unittest.TestCase):
    @patch("app.create_rotation_vessel_with_role")
    def test_vessel_create_route_success(self, mock_create):
        """POST /api/rotation-vessels calls create_rotation_vessel_with_role and returns 201."""
        from app import app
        mock_create.return_value = {"success": True, "id": 55, "type": "senior"}

        client = app.test_client()
        payload = {
            "job_title": "mualimI",
            "vessel": "D",
            "part": "deck",
            "categorization": "container",
            "groups": {"group1": ["KM. SHIP 1"]},
        }
        res = client.post("/api/rotation-vessels", json=payload)
        self.assertEqual(res.status_code, 201)
        mock_create.assert_called_once()

    @patch("app.create_rotation_vessel_with_role")
    def test_vessel_create_route_role_integrity_503(self, mock_create):
        """POST /api/rotation-vessels returns 503 when RoleIntegrityError occurs."""
        from app import app
        mock_create.side_effect = RoleIntegrityError("Role classification missing in DB")

        client = app.test_client()
        payload = {
            "job_title": "mualimI",
            "vessel": "D",
            "part": "deck",
            "categorization": "container",
            "groups": {"group1": ["KM. SHIP 1"]},
        }
        res = client.post("/api/rotation-vessels", json=payload)
        self.assertEqual(res.status_code, 503)
        data = res.get_json()
        self.assertIn("Role integrity check failed", data["error"])

    @patch("app.update_rotation_vessel_with_role")
    def test_vessel_update_route_success(self, mock_update):
        """PUT /api/rotation-vessels/<id> calls update_rotation_vessel_with_role and returns 200."""
        from app import app
        mock_update.return_value = {"success": True, "type": "junior"}

        client = app.test_client()
        payload = {
            "job_title": "mualimII",
            "vessel": "E",
            "part": "deck",
            "categorization": "container",
            "groups": {"group1": ["KM. SHIP 2"]},
        }
        res = client.put("/api/rotation-vessels/101", json=payload)
        self.assertEqual(res.status_code, 200)
        mock_update.assert_called_once()

    @patch("app.update_rotation_vessel_with_role")
    def test_vessel_update_route_role_integrity_503(self, mock_update):
        """PUT /api/rotation-vessels/<id> returns 503 when RoleIntegrityError occurs."""
        from app import app
        mock_update.side_effect = RoleIntegrityError("Role classification missing in DB")

        client = app.test_client()
        payload = {
            "job_title": "mualimII",
            "vessel": "E",
            "part": "deck",
            "categorization": "container",
            "groups": {"group1": ["KM. SHIP 2"]},
        }
        res = client.put("/api/rotation-vessels/101", json=payload)
        self.assertEqual(res.status_code, 503)
        data = res.get_json()
        self.assertIn("Role integrity check failed", data["error"])

    @patch("app.get_all_role_settings")
    def test_api_get_role_settings_success(self, mock_get_all):
        """GET /api/role-settings returns 200 and all settings map."""
        from app import app
        mock_get_all.return_value = DEFAULT_ROLE_SETTINGS

        client = app.test_client()
        res = client.get("/api/role-settings")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("container", data["data"])

    @patch("app.reset_role_settings")
    def test_api_reset_role_settings_success(self, mock_reset):
        """POST /api/role-settings/reset returns 200 and reset settings map."""
        from app import app
        mock_reset.return_value = DEFAULT_ROLE_SETTINGS

        client = app.test_client()
        res = client.post("/api/role-settings/reset", json={"categorization": "container"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")

    @patch("app.save_role_setting")
    def test_role_setting_save_invariant_violation_returns_409(self, mock_save):
        """POST /api/role-settings returns 409 Conflict when minimum role invariant is violated."""
        from app import app
        mock_save.side_effect = ValueError("Rotasi Senior minimal harus memiliki 1 posisi perwira.")

        client = app.test_client()
        payload = {
            "categorization": "container",
            "position": "KKM",
            "role_type": "junior",
        }
        res = client.post("/api/role-settings", json=payload)
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertEqual(data["status"], "error")
        self.assertIn("minimal harus memiliki 1 posisi perwira", data["message"])

    @patch("app.save_role_setting")
    def test_role_setting_save_invalid_input_returns_400(self, mock_save):
        """POST /api/role-settings returns 400 for bad input."""
        from app import app
        mock_save.side_effect = ValueError("Invalid categorization 'invalid_cat'")

        client = app.test_client()
        payload = {
            "categorization": "invalid_cat",
            "position": "KKM",
            "role_type": "junior",
        }
        res = client.post("/api/role-settings", json=payload)
        self.assertEqual(res.status_code, 400)

    @patch("app.save_role_setting")
    def test_role_setting_save_sanitizes_db_error_503(self, mock_save):
        """POST /api/role-settings returns sanitized 503 without leaking SQL errors."""
        from app import app
        mock_save.side_effect = RuntimeError("FATAL: connection to server on socket failed (SQL statement error)")

        client = app.test_client()
        payload = {
            "categorization": "container",
            "position": "KKM",
            "role_type": "junior",
        }
        res = client.post("/api/role-settings", json=payload)
        self.assertEqual(res.status_code, 503)
        data = res.get_json()
        self.assertEqual(data["message"], "Failed to save role setting.")
        self.assertNotIn("SQL statement error", data["message"])

    @patch("app.get_all_role_settings")
    @patch("database.database.get_db_connection")
    def test_health_check_operational_200(self, mock_get_conn, mock_get_roles):
        """GET /api/health returns 200 when database ping succeeds and role settings are complete."""
        from app import app
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        mock_get_roles.return_value = DEFAULT_ROLE_SETTINGS

        client = app.test_client()
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("operational", data["message"])

    @patch("app.get_all_role_settings")
    @patch("database.database.get_db_connection")
    def test_health_check_unhealthy_503_on_role_integrity_error(self, mock_get_conn, mock_get_roles):
        """GET /api/health returns 503 when role integrity validation fails."""
        from app import app
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        mock_get_roles.side_effect = RoleIntegrityError("Corrupted role_settings: missing positions")

        client = app.test_client()
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 503)
        data = res.get_json()
        self.assertEqual(data["status"], "unhealthy")
        self.assertEqual(data["message"], "Role settings integrity check failed")

    @patch("database.database.get_db_connection")
    def test_health_check_unhealthy_503_on_db_error(self, mock_get_conn):
        """GET /api/health returns sanitized 503 when database ping throws error."""
        from app import app
        mock_get_conn.side_effect = RuntimeError("DB connection refused")

        client = app.test_client()
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 503)
        data = res.get_json()
        self.assertEqual(data["status"], "unhealthy")
        self.assertEqual(data["message"], "Service unavailable")


if __name__ == "__main__":
    unittest.main()
