"""
Unit and integration tests for GET /api/search-onduty-all endpoint
and onduty_all_service.
"""

import unittest
from unittest.mock import patch
import pandas as pd

from app import app
from services.onduty_all_service import get_all_onduty_seamen


class TestOnDutyAllEndpoint(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

        self.mock_seamen_data = pd.DataFrame([
            {
                "seamancode": 1001,
                "seafarercode": "S1001",
                "name": "BUDI SANTOSO",
                "last_position": "NAKHODA",
                "last_location": "KM. ORIENTAL JADE",
                "status": "ON BOARD",
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "day_elapsed": 200,
                "day_remains": 165,
                "age": 45,
                "certificate": "ANT-I",
                "phone_number_1": "08111111",
                "phone_number_2": "",
                "phone_number_3": "",
                "phone_number_4": "",
            },
            {
                "seamancode": 1002,
                "seafarercode": "S1002",
                "name": "AHMAD ROFIQ",
                "last_position": "KKM",
                "last_location": "KM. ORIENTAL JADE",
                "status": "ON BOARD",
                "start_date": "2026-02-01",
                "end_date": "2027-01-31",
                "day_elapsed": 150,
                "day_remains": 215,
                "age": 42,
                "certificate": "ATT-I",
                "phone_number_1": "08222222",
                "phone_number_2": "",
                "phone_number_3": "",
                "phone_number_4": "",
            },
            {
                "seamancode": 1003,
                "seafarercode": "S1003",
                "name": "JOKO WIDODO",
                "last_position": "MUALIM I",
                "last_location": "DARAT STAND-BY",
                "status": "OFF",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
                "day_elapsed": 30,
                "day_remains": 0,
                "age": 35,
                "certificate": "ANT-II",
                "phone_number_1": "08333333",
                "phone_number_2": "",
                "phone_number_3": "",
                "phone_number_4": "",
            },
            {
                "seamancode": 1004,
                "seafarercode": "S1004",
                "name": "ALIM AWALUDIN",
                "last_position": "MUALIM II",
                "last_location": "BC. SURABAYA RAYA",
                "status": "ON BOARD",
                "start_date": "2026-03-01",
                "end_date": "2027-02-28",
                "day_elapsed": 80,
                "day_remains": 285,
                "age": 29,
                "certificate": "ANT-III",
                "phone_number_1": "08444444",
                "phone_number_2": "",
                "phone_number_3": "",
                "phone_number_4": "",
            },
        ])

    @patch("services.onduty_all_service.get_seamen_as_data")
    def test_get_all_onduty_excludes_offboard(self, mock_get_seamen):
        mock_get_seamen.return_value = self.mock_seamen_data.copy()

        results = get_all_onduty_seamen()
        self.assertEqual(len(results), 3)  # Excludes DARAT STAND-BY (seamancode 1003)
        codes = [r["seamancode"] for r in results]
        self.assertNotIn(1003, codes)
        self.assertIn(1001, codes)
        self.assertIn(1002, codes)
        self.assertIn(1004, codes)

    @patch("services.onduty_all_service.get_seamen_as_data")
    def test_filter_by_vessel_flexible(self, mock_get_seamen):
        mock_get_seamen.return_value = self.mock_seamen_data.copy()

        # Search with prefix omitted
        results = get_all_onduty_seamen(vessel="ORIENTAL JADE")
        self.assertEqual(len(results), 2)
        for r in results:
            self.assertEqual(r["last_location"], "KM. ORIENTAL JADE")

        # Search with partial BC vessel name
        bc_results = get_all_onduty_seamen(vessel="SURABAYA")
        self.assertEqual(len(bc_results), 1)
        self.assertEqual(bc_results[0]["seamancode"], 1004)

    @patch("services.onduty_all_service.get_seamen_as_data")
    def test_filter_by_rank(self, mock_get_seamen):
        mock_get_seamen.return_value = self.mock_seamen_data.copy()

        results = get_all_onduty_seamen(rank="KKM")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "AHMAD ROFIQ")

    @patch("services.onduty_all_service.get_seamen_as_data")
    def test_filter_by_part(self, mock_get_seamen):
        mock_get_seamen.return_value = self.mock_seamen_data.copy()

        # Engine department should return KKM
        engine_results = get_all_onduty_seamen(part="engine")
        self.assertEqual(len(engine_results), 1)
        self.assertEqual(engine_results[0]["last_position"], "KKM")

        # Deck department should return NAKHODA and MUALIM II
        deck_results = get_all_onduty_seamen(part="deck")
        self.assertEqual(len(deck_results), 2)

    @patch("services.onduty_all_service.get_seamen_as_data")
    def test_filter_by_name_or_code(self, mock_get_seamen):
        mock_get_seamen.return_value = self.mock_seamen_data.copy()

        # Partial name search
        name_results = get_all_onduty_seamen(name="ALIM")
        self.assertEqual(len(name_results), 1)
        self.assertEqual(name_results[0]["seamancode"], 1004)

        # Seamancode search
        code_results = get_all_onduty_seamen(name="1001")
        self.assertEqual(len(code_results), 1)
        self.assertEqual(code_results[0]["name"], "BUDI SANTOSO")

    @patch("services.onduty_all_service.get_seamen_as_data")
    def test_http_endpoint(self, mock_get_seamen):
        mock_get_seamen.return_value = self.mock_seamen_data.copy()

        resp = self.app.get("/api/search-onduty-all?vessel=ORIENTAL%20JADE&rank=NAKHODA")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["name"], "BUDI SANTOSO")
        self.assertEqual(data[0]["last_position"], "NAKHODA")
        self.assertEqual(data[0]["day_elapsed"], 200)
        self.assertEqual(data[0]["day_remains"], 165)


if __name__ == "__main__":
    unittest.main()

