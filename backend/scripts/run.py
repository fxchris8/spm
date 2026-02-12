"""
Script ini digunakan untuk mengotomatisasi proses instalasi dependensi dari file requirements.txt
dan menjalankan file aplikasi utama (app.py).
"""

import os
import subprocess
import sys


def install_requirements():
    """Install dependencies dari requirements.txt"""
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
        )
    except subprocess.CalledProcessError as e:
        print("Gagal install requirements:", e)
        sys.exit(1)


def run_app():
    """Jalankan app.py"""
    os.execv(sys.executable, [sys.executable, "app.py"])


if __name__ == "__main__":
    install_requirements()
    run_app()
