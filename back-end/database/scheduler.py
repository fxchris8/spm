# @faw_sd
# Scheduler untuk sync data dari API ASLI ke Supabase setiap 00:01

import json
from datetime import datetime

import pandas as pd
import requests
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# Import database functions dari connection.py
from connection import sync_mutations_to_database, sync_seamen_to_database

print("=" * 60)
print("SEAMEN & MUTATIONS SCHEDULER")
print("=" * 60)


# ============================================================================
# BAGIAN 1: FETCH DATA DARI API ASLI
# ============================================================================


def fetch_seamen_from_original_api():
    """Fetch data seamen dari API URL ASLI"""
    print(f"START - [{datetime.now()}] Starting seamen sync from ORIGINAL API...")

    try:
        url = "http://nanika.spil.co.id:3021/get-seamen"
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


def fetch_mutations_from_original_api():
    """Fetch data mutations dari API URL ASLI"""
    print(f"START - [{datetime.now()}] Starting mutations sync from ORIGINAL API...")

    try:
        url = "http://nanika.spil.co.id:3021/get-mutation"
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


# ============================================================================
# BAGIAN 2: SCHEDULED JOBS
# ============================================================================


def scheduled_sync_seamen():
    """Job untuk sync seamen - dijalankan setiap 00.01"""
    df = fetch_seamen_from_original_api()
    if df is not None:
        sync_seamen_to_database(df)
    else:
        print("FAIL - Failed to fetch seamen data, skipping sync")


def scheduled_sync_mutations():
    """Job untuk sync mutations - dijalankan setiap 00.01"""
    df = fetch_mutations_from_original_api()
    if df is not None:
        sync_mutations_to_database(df)
    else:
        print("FAIL - Failed to fetch mutations data, skipping sync")


def start_scheduler():
    """Mulai scheduler untuk sync otomatis setiap 00.01"""
    scheduler = BlockingScheduler()

    # Sync seamen setiap pukul 00.01
    scheduler.add_job(
        scheduled_sync_seamen,
        CronTrigger(hour=0, minute=1),
        id="sync_seamen_job",
        name="Sync Seamen Data dari Original API",
        replace_existing=True,
    )

    # Sync mutations setiap pukul 00.01
    scheduler.add_job(
        scheduled_sync_mutations,
        CronTrigger(hour=0, minute=1),
        id="sync_mutations_job",
        name="Sync Mutations Data dari Original API",
        replace_existing=True,
    )

    print("\nDONE - Scheduler started successfully!")
    print("Jobs scheduled:")
    print("   - Seamen sync: Every day at 00:01")
    print("   - Mutations sync: Every day at 00:01")
    print("\nWaiting for scheduled time... (Press Ctrl+C to stop)\n")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\nSTOP - Scheduler stopped by user")


def manual_sync_all():
    """Sync manual semua data (untuk testing)"""
    print("\nManual sync initiated...\n")
    scheduled_sync_seamen()
    scheduled_sync_mutations()
    print("\nDONE - Manual sync completed!\n")


# ============================================================================
# BAGIAN 3: MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--manual":
        # Manual sync
        manual_sync_all()
    else:
        # Start scheduler
        start_scheduler()
