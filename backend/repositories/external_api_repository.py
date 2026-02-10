"""
External API Repository
Handles fetching data from external API (API Pusat).
"""

import json
import os
from datetime import datetime

import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL_PUSAT = os.getenv("API_BASE_URL_PUSAT")


def fetch_seamen_from_api():
    """
    Fetch data seamen dari API Pusat.

    Returns:
        DataFrame: DataFrame berisi data seamen, atau None jika gagal
    """
    print(f"START - [{datetime.now()}] Starting seamen sync from ORIGINAL API...")

    try:
        url = f"{API_BASE_URL_PUSAT}/get-seamen"
        payload = json.dumps(
            {
                "age": 0,
                "status": "",
                "education": "",
                "experience": "",
                "certificate": "",
                "last_location": "",
                "last_position": "",
            }
        )
        headers = {"Content-Type": "application/json"}

        response = requests.get(url, headers=headers, data=payload, timeout=30)

        if response.status_code == 200:
            response_dict = response.json()
            data_seamen = response_dict.get("data_seamen", [])

            if data_seamen:
                df = pd.DataFrame(data_seamen)
                print(f"DONE - Fetched {len(df)} seamen records from ORIGINAL API")
                return df
            else:
                print("WARNING - ORIGINAL API returned empty data")
                return None
        else:
            print(f"FAIL - ORIGINAL API returned status code {response.status_code}")
            return None

    except Exception as e:
        print(f"FAIL - Error fetching from ORIGINAL API: {str(e)}")
        return None


def fetch_mutations_from_api():
    """
    Fetch data mutations dari API Pusat.

    Returns:
        DataFrame: DataFrame berisi data mutations, atau None jika gagal
    """
    print(f"START - [{datetime.now()}] Starting mutations sync from ORIGINAL API...")

    try:
        url = f"{API_BASE_URL_PUSAT}/get-mutation"
        payload = json.dumps(
            {
                "seaman_name": "",
                "transaction_date_1": "01/01/2020",
                "transaction_date_2": "01/01/2025",
                "from_rank_name": "",
                "to_rank_name": "",
                "from_vessel_code": "",
                "to_vessel_code": "",
                "jenis": "",
            }
        )
        headers = {"Content-Type": "application/json"}

        response = requests.get(url, headers=headers, data=payload, timeout=30)

        if response.status_code == 200:
            response_dict = response.json()
            data_mutation = response_dict.get("data_mutation", [])

            if data_mutation:
                df = pd.DataFrame(data_mutation)
                print(f"DONE - Fetched {len(df)} mutation records from ORIGINAL API")
                return df
            else:
                print("WARNING - ORIGINAL API returned empty data")
                return None
        else:
            print(f"FAIL - ORIGINAL API returned status code {response.status_code}")
            return None

    except Exception as e:
        print(f"FAIL - Error fetching from ORIGINAL API: {str(e)}")
        return None
