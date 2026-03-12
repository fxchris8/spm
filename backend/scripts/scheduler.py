"""
Module ini menjalankan scheduler untuk sinkronisasi data seamen dan mutasi
dari API eksternal ke database secara otomatis setiap pukul 00:01.
"""

from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from services import manual_sync

print("=" * 60)
print("SEAMEN & MUTATIONS SCHEDULER")
print("=" * 60)


def scheduled_sync():
    """
    Job untuk sync seamen dan mutations - dijalankan setiap 00.01.
    Menggunakan service layer untuk handle business logic.
    """
    try:
        print(f"[SCHEDULED SYNC] Starting at {datetime.now()}")
        result = manual_sync()
        print(f"[SCHEDULED SYNC] {result.get('message')}")
        print(f"[SCHEDULED SYNC] Completed at {datetime.now()}")
    except Exception as e:
        print(f"[SCHEDULED SYNC] Error: {str(e)}")


def start_scheduler():
    """Mulai scheduler untuk sync otomatis setiap 00.01"""
    scheduler = BlockingScheduler()

    scheduler.add_job(
        scheduled_sync,
        CronTrigger(hour=0, minute=1),
        id="sync_all_job",
        name="Sync Seamen & Mutations Data dari Original API",
        replace_existing=True,
    )

    print("\nDONE - Scheduler started successfully!")
    print("Jobs scheduled:")
    print("   - Seamen & Mutations sync: Every day at 00:01")
    print("\nWaiting for scheduled time... (Press Ctrl+C to stop)\n")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\nSTOP - Scheduler stopped by user")


def manual_sync_all():
    """
    Sync manual semua data (untuk testing).
    Menggunakan service layer untuk handle business logic.
    """
    print("\nManual sync initiated...\n")
    try:
        result = manual_sync()
        print(f"\n{result.get('message')}")
        print("\nDONE - Manual sync completed!\n")
    except Exception as e:
        print(f"\nFAIL - Manual sync failed: {str(e)}\n")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--manual":
        manual_sync_all()
    else:
        start_scheduler()
