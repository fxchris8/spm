"""
Unit tests for multi-role support across Senior and Junior rotation endpoints:
- container-rotation endpoint for all 8 positions
- mutasi_filtered endpoint for all 8 positions
- cadangan endpoints for all 8 positions
- get_crew_for_job generic resolution and backward-compatible wrappers
"""

import unittest
from unittest.mock import MagicMock, patch
import pandas as pd
from flask import json

import sys
# Pre-mock dependencies if needed
for mod in ["gensim", "gensim.models", "sklearn", "sklearn.feature_extraction", "sklearn.feature_extraction.text", "sklearn.metrics", "sklearn.metrics.pairwise"]:
    if mod not in sys.modules:
        sys.modules[mod] = MagicMock()

from app import app
from rotation import (
    get_crew_for_job,
    get_nahkoda,
    get_kkm,
    get_mualimI,
    get_masinisII,
)


class TestMultiRoleEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch("app.get_schedule")
    @patch("app.get_crew_for_job")
    def test_container_rotation_accepts_all_8_positions(self, mock_get_crew, mock_get_schedule):
        mock_schedule_df = pd.DataFrame({"Ship": ["KM. TEST"], "January 2026": ["A"]})
        mock_crew_df = pd.DataFrame({
            "Index": ["A"],
            "name": ["John Doe"],
            "last_location": ["KM. TEST"],
            "seamancode": [12345],
            "start_date": ["2026-01-01"],
            "end_date": ["2026-06-01"],
            "first_rotation_date": ["01-01-2026"],
        })
        mock_get_schedule.return_value = mock_schedule_df
        mock_get_crew.return_value = mock_crew_df

        payload = {
            "selected_group": "D1",
            "cadangan": ["12345"],
            "kapal": ["KM. TEST"],
            "categorization": "container",
            "part": "deck",
        }

        all_jobs = [
            ("NAKHODA", "NAKHODA"),
            ("KKM", "KKM"),
            ("MUALIMI", "MUALIM I"),
            ("MUALIM I", "MUALIM I"),
            ("MASINISII", "MASINIS II"),
            ("MASINIS II", "MASINIS II"),
            ("MUALIMII", "MUALIM II"),
            ("MUALIM II", "MUALIM II"),
            ("MUALIMIII", "MUALIM III"),
            ("MUALIM III", "MUALIM III"),
            ("MASINISIII", "MASINIS III"),
            ("MASINIS III", "MASINIS III"),
            ("MASINISIV", "MASINIS IV"),
            ("MASINIS IV", "MASINIS IV"),
        ]

        for query_job, expected_canonical in all_jobs:
            with self.subTest(query_job=query_job):
                resp = self.app.post(
                    f"/api/container-rotation?job={query_job}",
                    data=json.dumps(payload),
                    content_type="application/json",
                )
                self.assertEqual(resp.status_code, 200, f"Failed for job '{query_job}': {resp.get_data(as_text=True)}")
                data = json.loads(resp.get_data(as_text=True))
                self.assertIn("schedule", data)
                self.assertIn("nahkoda", data)
                self.assertEqual(mock_get_schedule.call_args[0][4], expected_canonical)
                self.assertEqual(mock_get_crew.call_args[0][0], expected_canonical)

    @patch("app.get_schedule")
    @patch("app.get_crew_for_job")
    def test_container_rotation_with_cadangan2_reliever(self, mock_get_crew, mock_get_schedule):
        mock_schedule_df = pd.DataFrame({"Ship": ["KM. TEST"], "January 2026": ["A"]})
        mock_crew_df = pd.DataFrame({
            "Index": ["A"],
            "name": ["John Doe"],
            "last_location": ["KM. TEST"],
            "seamancode": [12345],
            "start_date": ["2026-01-01"],
            "end_date": ["2026-06-01"],
            "first_rotation_date": ["01-01-2026"],
        })
        mock_reliever_df = pd.DataFrame({
            "Index": ["Z0"],
            "name": ["Reliever Joe"],
            "last_location": ["DARAT"],
            "seamancode": [67890],
            "start_date": ["2026-01-01"],
            "end_date": ["2026-06-01"],
            "first_rotation_date": ["01-01-2026"],
        })
        mock_get_schedule.return_value = mock_schedule_df
        mock_get_crew.side_effect = [mock_crew_df, mock_reliever_df]

        payload = {
            "selected_group": "D1",
            "cadangan": ["12345"],
            "cadangan2": ["67890"],
            "kapal": ["KM. TEST"],
            "categorization": "container",
            "part": "deck",
        }

        resp = self.app.post(
            "/api/container-rotation?job=MASINISIII",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.get_data(as_text=True))
        self.assertIn("schedule", data)
        self.assertIn("nahkoda", data)
        self.assertIsNotNone(data.get("darat"))

        self.assertEqual(mock_get_crew.call_count, 2)
        second_call = mock_get_crew.call_args_list[1]
        self.assertEqual(second_call[0][0], "MASINIS III")
        self.assertEqual(second_call[0][5], "ONE")

    def test_container_rotation_rejects_invalid_job(self):
        payload = {
            "selected_group": "D1",
            "cadangan": ["12345"],
        }
        resp = self.app.post(
            "/api/container-rotation?job=INVALID_JOB",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.get_data(as_text=True))
        self.assertIn("tidak valid", data.get("message", ""))

    @patch("app.get_seamen_as_data")
    @patch("app.get_mutations_as_data")
    def test_mutasi_filtered_accepts_all_8_positions(self, mock_mutations, mock_seamen):
        positions = [
            "NAKHODA",
            "KKM",
            "MUALIM I",
            "MASINIS II",
            "MUALIM II",
            "MUALIM III",
            "MASINIS III",
            "MASINIS IV",
        ]
        mock_seamen.return_value = pd.DataFrame({
            "seamancode": [1000 + i for i in range(len(positions))],
            "name": [f"Sailor {i}" for i in range(len(positions))],
            "last_location": ["DARAT STAND-BY"] * len(positions),
            "last_position": positions,
            "prevlocation": ["KM. SHIP1"] * len(positions),
            "date_of_birth": ["1990-01-01"] * len(positions),
            "date_of_entry": ["2015-01-01"] * len(positions),
            "date_of_last_sign_on": ["2025-01-01"] * len(positions),
            "end_date": ["2025-10-01"] * len(positions),
        })
        mock_mutations.return_value = pd.DataFrame({
            "seamancode": [1000 + i for i in range(len(positions))],
            "fromvesselname": ["KM. SHIP1"] * len(positions),
        })

        test_cases = [
            ("MASINISIII", 200),
            ("MASINIS III", 200),
            ("MUALIMII", 200),
            ("MUALIM II", 200),
            ("MUALIMIII", 200),
            ("MUALIM III", 200),
            ("MASINISIV", 200),
            ("MASINIS IV", 200),
            ("NAKHODA", 200),
            ("KKM", 200),
            ("MUALIMI", 200),
            ("MASINISII", 200),
            ("INVALID_ROLE", 400),
        ]

        for job_query, expected_status in test_cases:
            with self.subTest(job=job_query):
                resp = self.app.get(f"/api/mutasi_filtered?job={job_query}")
                self.assertEqual(resp.status_code, expected_status)
                if expected_status == 400:
                    data = json.loads(resp.get_data(as_text=True))
                    self.assertIn("Job tidak valid", data.get("message", ""))

    @patch("controllers.cadangan_controller.get_cadangan_mualim_ii_data")
    @patch("controllers.cadangan_controller.get_cadangan_mualim_iii_data")
    @patch("controllers.cadangan_controller.get_cadangan_masinis_iii_data")
    @patch("controllers.cadangan_controller.get_cadangan_masinis_iv_data")
    def test_new_cadangan_endpoints_return_200(
        self, mock_masinis_iv, mock_masinis_iii, mock_mualim_iii, mock_mualim_ii
    ):
        mock_mualim_ii.return_value = [{"name": "M2", "last_location": "DARAT", "seamancode": 1}]
        mock_mualim_iii.return_value = [{"name": "M3", "last_location": "DARAT", "seamancode": 2}]
        mock_masinis_iii.return_value = [{"name": "E3", "last_location": "DARAT", "seamancode": 3}]
        mock_masinis_iv.return_value = [{"name": "E4", "last_location": "DARAT", "seamancode": 4}]

        endpoints = [
            ("/api/cadangan-mualimII", 1),
            ("/api/cadangan-mualimIII", 2),
            ("/api/cadangan-masinisIII", 3),
            ("/api/cadangan-masinisIV", 4),
        ]

        for url, expected_code in endpoints:
            with self.subTest(url=url):
                resp = self.app.get(url)
                self.assertEqual(resp.status_code, 200)
                data = json.loads(resp.get_data(as_text=True))
                self.assertEqual(len(data), 1)
                self.assertEqual(data[0]["seamancode"], expected_code)


class TestGenericCrewResolution(unittest.TestCase):
    @patch("rotation.get_seamen_as_data")
    @patch("rotation.get_group_job_crew")
    @patch("rotation.add_first_rotation_date_column")
    def test_get_crew_for_job_generic(self, mock_add_date, mock_group_crew, mock_seamen):
        mock_seamen.return_value = pd.DataFrame({
            "seamancode": [101, 102],
            "name": ["Crew A", "Crew B"],
            "last_location": ["DARAT", "DARAT"],
            "start_date": ["2025-01-01", "2025-01-01"],
            "end_date": ["2025-10-01", "2025-10-01"],
        })
        mock_crew_df = pd.DataFrame({
            "seamancode": [101],
            "name": ["Crew A"],
            "last_location": ["DARAT"],
            "start_date": ["2025-01-01"],
            "end_date": ["2025-10-01"],
        })
        mock_group_crew.return_value = mock_crew_df
        mock_add_date.side_effect = lambda df: df.assign(first_rotation_date="01-01-2026")

        result = get_crew_for_job("MASINIS III", "E1", [], "container", "engine")
        self.assertFalse(result.empty)
        self.assertEqual(result.iloc[0]["Index"], "A")
        self.assertEqual(result.iloc[0]["name"], "Crew A")

    @patch("rotation.get_crew_for_job")
    def test_wrapper_functions_delegate_correctly(self, mock_get_crew):
        mock_get_crew.return_value = pd.DataFrame()

        get_nahkoda("D1", [], "container", "deck")
        mock_get_crew.assert_called_with("NAKHODA", "D1", [], "container", "deck", quantity="ALL", vessel_names=None)

        get_kkm("E1", [], "container", "engine")
        mock_get_crew.assert_called_with("KKM", "E1", [], "container", "engine", quantity="ALL", vessel_names=None)

        get_mualimI("D1", [], "container", "deck")
        mock_get_crew.assert_called_with("MUALIM I", "D1", [], "container", "deck", quantity="ALL", vessel_names=None)

        get_masinisII("E1", [], "container", "engine")
        mock_get_crew.assert_called_with("MASINIS II", "E1", [], "container", "engine", quantity="ALL", vessel_names=None)


if __name__ == "__main__":
    unittest.main()
