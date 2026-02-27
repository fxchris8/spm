import io
import os
import pathlib
from datetime import datetime

import pandas as pd
from flask import Flask, jsonify, request, send_file
from ai import (
    filter_in_vessel,
    getRecommendation,
    load_word2vec_model,
    vessel_group_id_deck,
)
from database.connection import (
    auto_accept_expired_rotations,
    check_has_pending_changes,
    check_job_submitted,
    create_rotation_vessel,
    delete_rotation_vessel,
    get_all_locked_seaman_codes,
    get_all_rotation_submissions,
    get_locked_rotations,
    get_mutations_as_data,
    get_rotation_submissions,
    get_rotation_vessel_by_id,
    get_rotation_vessels,
    get_seamen_as_data,
    get_submitted_seamancodes,
    save_locked_rotation,
    submit_all_rotations,
    unlock_rotation,
    update_rotation_status_change,
    update_rotation_vessel,
)
from rotation import get_kkm, get_masinisII, get_mualimI, get_nahkoda, get_schedule
from middlewares import init_cors
from routes import auth_bp, cadangan_bp, dashboard_bp, promotion_bp, search_bp

app = Flask(__name__)
app.secret_key = "supersecretkey"

init_cors(app)
load_word2vec_model()


# ============================================================================
# REGISTER BLUEPRINTS
# ============================================================================


app.register_blueprint(cadangan_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(promotion_bp, url_prefix="/api")
app.register_blueprint(search_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/api")


# ============================================================================
# BAGIAN 1: BASIC & UTILITY ENDPOINTS
# ============================================================================


@app.route("/")
def index():
    """
    Health check endpoint to verify Flask application is running.

    Returns:
        str: Simple status message
    """
    return "Flask app is running!"


# ============================================================================
# BAGIAN 3: CREW DATA & MUTATIONS
# ============================================================================


def generate_schedule(ship_names, first_assignments, start_year, end_year):
    months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ]
    # Calculate total months based on start and end year
    total_months = (end_year - start_year + 1) * 12

    # Generate headers for the schedule based on the range of years
    headers = []
    for i in range(total_months):
        month_name = months[i % 12]
        current_year = start_year + (i // 12)
        headers.append(f"{month_name} {current_year}")

    # Create the schedule DataFrame with ship names as index
    schedule = pd.DataFrame(columns=headers, index=ship_names)

    crew = [f"C{i+1}" for i in range(len(ship_names) + 1)]
    sorted_assignments = sorted(
        enumerate(first_assignments, start=1), key=lambda x: x[1]["month"]
    )

    for i, (ship_idx, assignment) in enumerate(sorted_assignments):
        start_month = (assignment["year"] - start_year) * 12 + assignment["month"] - 1
        # ship_name = ship_names[ship_idx - 1]
        crew_idx = i % len(crew)

        # Assign initial crew based on start month
        for j in range(len(ship_names)):
            current_month = (start_month + j) % total_months
            schedule.iloc[ship_idx - 1, current_month] = crew[crew_idx]

        # Assign transaction crew after initial period
        transaction_crew_idx = (crew_idx - 1) % len(crew)
        last_transaction_month = start_month

        for j in range(start_month + len(ship_names), total_months, len(ship_names)):
            current_month = j % total_months
            schedule.iloc[ship_idx - 1, current_month] = (
                f"{crew[transaction_crew_idx]} (transaction)"
            )

            # After each transaction, backfill NaN months between this and the previous transaction
            for k in range(last_transaction_month + 1, current_month):
                if pd.isna(schedule.iloc[ship_idx - 1, k]):
                    schedule.iloc[ship_idx - 1, k] = crew[crew_idx]

            last_transaction_month = current_month
            crew_idx = transaction_crew_idx
            transaction_crew_idx = (transaction_crew_idx - 1) % len(crew)

        # After the final transaction, fill the remaining NaN months
        for k in range(last_transaction_month + 1, total_months):
            if pd.isna(schedule.iloc[ship_idx - 1, k]):
                schedule.iloc[ship_idx - 1, k] = crew[crew_idx]

    return schedule


def df_to_json(df: pd.DataFrame):
    """
    Mengubah DataFrame menjadi struktur JSON:
    {
      "columns": [...],
      "data": [
        { "column1": value, "column2": value, ... },
        ...
      ]
    }
    """
    return {"columns": df.columns.tolist(), "data": df.to_dict(orient="records")}


@app.route("/api/container-rotation", methods=["POST"])
def container_rotation_api():
    try:
        # Ambil parameter 'job' dari query string
        job_raw = request.args.get("job", default="NAKHODA")

        # LOGGING untuk debugging
        # print(f"[DEBUG] Query parameter 'job' yang diterima: '{job_raw}'")

        # Mapping konsisten
        job_mapping = {
            "NAKHODA": "NAKHODA",
            "KKM": "KKM",
            "MUALIMI": "MUALIM I",
            "MASINISII": "MASINIS II",
        }

        # Konversi ke uppercase dan validasi
        job_raw_upper = job_raw.upper()

        if job_raw_upper not in job_mapping:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Job '{job_raw}' tidak valid. Pilih antara: {', '.join(job_mapping.keys())}",
                    }
                ),
                400,
            )

        # Ambil nilai job dari mapping
        job = job_mapping[job_raw_upper]

        # LOGGING
        # print(f"[DEBUG] Job setelah mapping: '{job}'")

        # Ambil data dari request body
        data = request.get_json()
        if not data:
            return jsonify({"error": "Tidak ada data yang diterima"}), 400

        required_fields = ["selected_group", "cadangan"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Field {field} diperlukan"}), 400

        # Ambil data dari payload
        selected_group = data["selected_group"]
        cadangan = data.get("cadangan", [])
        cadangan2 = data.get("cadangan2", [])
        type_vessel = data.get("categorization")
        part = data.get("part")

        # LOGGING
        # print(f"[DEBUG] Memanggil get_schedule dengan job='{job}'")

        # Dapatkan DataFrame schedule dengan parameter job
        schedule_df = get_schedule(selected_group, cadangan, type_vessel, part, job)

        # PILIH FUNGSI YANG TEPAT BERDASARKAN JOB
        # print(f"[DEBUG] Memanggil fungsi crew untuk job='{job}'")

        if job == "NAKHODA":
            crew_df = get_nahkoda(selected_group, cadangan, type_vessel, part)
        elif job == "KKM":
            crew_df = get_kkm(selected_group, cadangan, type_vessel, part)
        elif job == "MUALIM I":
            crew_df = get_mualimI(selected_group, cadangan, type_vessel, part)
        elif job == "MASINIS II":
            crew_df = get_masinisII(selected_group, cadangan, type_vessel, part)
        else:
            return jsonify({"error": f"Fungsi untuk job {job} belum tersedia"}), 400

        # print(f"[DEBUG] Crew DataFrame shape: {crew_df.shape}")

        # Konversi ke JSON
        schedule_json = df_to_json(schedule_df)
        nahkoda_json = df_to_json(crew_df)  # ← Tetap pakai nama variable "nahkoda_json"

        # Jika ada cadangan2 (reliever data)
        darat_json = None
        if cadangan2:
            # print(f"[DEBUG] Memproses cadangan2 (reliever) untuk job='{job}'")

            # Parameter "ONE" akan membuat fungsi menghasilkan index Z0, Z1, Z2...
            if job == "NAKHODA":
                darat_df = get_nahkoda(
                    selected_group, cadangan2, type_vessel, part, "ONE"
                )
            elif job == "KKM":
                darat_df = get_kkm(selected_group, cadangan2, type_vessel, part, "ONE")
            elif job == "MUALIM I":
                darat_df = get_mualimI(
                    selected_group, cadangan2, type_vessel, part, "ONE"
                )
            elif job == "MASINIS II":
                darat_df = get_masinisII(
                    selected_group, cadangan2, type_vessel, part, "ONE"
                )

            darat_json = df_to_json(darat_df)
            # print(f"[DEBUG] Darat DataFrame shape: {darat_df.shape}")
            if not darat_df.empty:
                # print(f"[DEBUG] Reliever Index pertama: {darat_df.iloc[0]['Index']}")
                pass

        # RESPONSE - TETAP GUNAKAN KEY "nahkoda"
        # print(f"[DEBUG] Mengirim response dengan job='{job}'")

        return jsonify(
            {
                "schedule": schedule_json,
                "nahkoda": nahkoda_json,  # ← KEY TETAP "nahkoda"
                "darat": darat_json,
            }
        )

    except Exception as e:
        app.logger.error(f"Error in container_rotation_api: {str(e)}", exc_info=True)
        print(f"[ERROR] Exception: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": "Terjadi kesalahan internal", "message": str(e)}), 500


# ============================================================================
# BAGIAN 4: CADANGAN (BACKUP/RESERVE) CREW DATA
# ============================================================================

# NOTE: Cadangan endpoints have been moved to layered architecture
# See: routes/cadangan_route.py -> controllers/cadangan_controller.py
#      -> services/cadangan_service.py -> repositories/cadangan_repository.py


@app.route("/api/mutasi_filtered", methods=["GET"])
def get_mutasi_filtered():
    try:
        # Ambil parameter 'job' dari query string
        job_raw = request.args.get("job", default=None)

        # Ambil parameter 'locked_codes' dari query string (optional)
        locked_codes_str = request.args.get("locked_codes", default="")
        # Convert ke set untuk filtering yang lebih cepat
        locked_codes = set(locked_codes_str.split(",")) if locked_codes_str else set()

        # Remove empty strings dari set
        locked_codes = {code.strip() for code in locked_codes if code.strip()}

        # print(f"[DEBUG] Locked codes received: {locked_codes}")  # Debugging

        job_mapping = {
            "NAKHODA": "NAKHODA",
            "KKM": "KKM",
            "MUALIMI": "MUALIM I",
            "MASINISII": "MASINIS II",
        }

        job = job_mapping.get(job_raw.upper() if job_raw else None)

        # Validasi job yang diterima
        if job not in ["NAKHODA", "KKM", "MUALIM I", "MASINIS II"]:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Job tidak valid. Pilih antara 'NAKHODA', 'KKM', 'MUALIM I' atau 'MASINIS II'.",
                    }
                ),
                400,
            )

        # Load from Supabase instead of Excel
        df_history = get_mutations_as_data()
        df_seamen = get_seamen_as_data()

        # Filter lokasi tertentu
        lokasi_filter = [
            "PENDING CUTI",
            "PENDING GAJI",
            "DARAT BIASA",
            "DARAT",
            "DARAT STAND-BY",
        ]

        # Ambil seamancode berdasarkan job
        seamancode_terfilter = df_seamen[
            (df_seamen["last_location"].isin(lokasi_filter))
            & (df_seamen["last_position"] == job)
        ]["seamancode"].unique()

        # **FILTER OUT LOCKED CODES DI SINI**
        # print(f"[DEBUG] Before filtering: {len(seamancode_terfilter)} seamen")

        # Convert seamancode_terfilter to strings untuk konsistensi
        seamancode_terfilter = [str(code).strip() for code in seamancode_terfilter]

        # Filter out locked codes
        seamancode_terfilter = [
            code for code in seamancode_terfilter if code not in locked_codes
        ]

        # print(f"[DEBUG] After filtering: {len(seamancode_terfilter)} seamen")

        # Filter df_history berdasarkan seamancode yang sudah difilter
        df_mutasi_filtered = df_history[
            df_history["seamancode"].astype(str).str.strip().isin(seamancode_terfilter)
        ]

        # Merge untuk mendapatkan nama
        df_mutasi_filtered = df_mutasi_filtered.merge(
            df_seamen[["seamancode", "name", "last_location"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Buat dictionary: seamancode -> {'name': ..., 'vessels': [...]} dengan vessels yang difilter
        mutasi_dict_filtered = (
            df_mutasi_filtered.groupby("seamancode")
            .apply(
                lambda g: {
                    "name": g["name"].iloc[0],
                    "last_location": g["last_location"].iloc[0],
                    "vessels": g.loc[
                        ~g["fromvesselname"].isin(lokasi_filter), "fromvesselname"
                    ]
                    .dropna()
                    .unique()
                    .tolist(),
                },
                include_groups=False,
            )
            .to_dict()
        )

        # print(f"[DEBUG] Final result count: {len(mutasi_dict_filtered)}")

        # Kirim response JSON
        return jsonify({"status": "success", "data": mutasi_dict_filtered})

    except Exception as e:
        app.logger.error(f"Error in mutasi_filtered: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/download_csv", methods=["POST"])
def download_csv():
    try:
        # Konversi HTML table yang dikirim menjadi DataFrame
        df_list = pd.read_html(request.form.get("schedule"))
        df = df_list[0]

        # Tulis DataFrame ke buffer in-memory dengan StringIO
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=True)

        # Konversi string CSV ke bytes menggunakan BytesIO
        csv_bytes = io.BytesIO(csv_buffer.getvalue().encode("utf-8"))
        csv_bytes.seek(0)

        # Kirim file CSV sebagai attachment
        return send_file(
            csv_bytes,
            mimetype="text/csv",
            as_attachment=True,
            download_name="schedule.csv",
        )
    except Exception as e:
        return f"An error occurred: {e}"


@app.route("/api/options", methods=["POST"])
def get_options():
    # Fetch fresh data from database
    seamen_df = get_seamen_as_data()

    data = request.get_json()

    type_ = data.get("type")
    part = data.get("part")

    copy_df = filter_in_vessel(seamen_df, type_)
    if part:
        copy_df = vessel_group_id_deck(copy_df, type_, part)
    else:
        copy_df = vessel_group_id_deck(copy_df, type_)

    rank_order = [
        "NAKHODA",
        "MUALIM I",
        "MUALIM II",
        "MUALIM III",
        "KKM",
        "MASINIS I",
        "MASINIS II",
        "MASINIS III",
        "SERANG",
        "JURU MUDI",
        "ELECTRICIAN",
        "MANDOR MESIN",
        "JURU MINYAK",
        "JURU MASAK I",
        "KADET DEK",
        "KADET MESIN",
        "EXTRA KKM",
        "KADET ELECTRONIC",
        "EXT. MUALIM I",
    ]

    cert_order = [
        "ANT-I",
        "ANT-II",
        "ANT-III",
        "ANT-IV",
        "ANT-V",
        "ANT-D",
        "ATT-I",
        "ATT-II",
        "ATT-III",
        "ATT-IV",
        "ATT-V",
        "ATT-D",
        "BASIC SAFETY TRAINING",
        "ETO",
    ]

    # Pilihan untuk setiap kolom
    bagian_option = (
        copy_df["BAGIAN"].unique().tolist() if "BAGIAN" in copy_df.columns else []
    )
    cert_option = (
        copy_df["certificate"].unique().tolist()
        if "certificate" in copy_df.columns
        else []
    )
    rank_option = (
        copy_df["last_position"].unique().tolist()
        if "last_position" in copy_df.columns
        else []
    )
    vessel_option = (
        copy_df["last_location"].unique().tolist()
        if "last_location" in copy_df.columns
        else []
    )

    # Urutkan rank_option berdasarkan rank_order
    rank_option = sorted(
        rank_option,
        key=lambda x: rank_order.index(x) if x in rank_order else len(rank_order),
    )

    # Urutkan cert_option berdasarkan cert_order
    cert_option = sorted(
        cert_option,
        key=lambda x: cert_order.index(x) if x in cert_order else len(cert_order),
    )

    data = {
        "bagian_option": bagian_option,
        "cert_option": cert_option,
        "rank_option": rank_option,
        "vessel_option": vessel_option,
    }
    return jsonify(data)


@app.route("/get-recommendation", methods=["POST"])
def get_recommendation():
    # Fetch fresh data from database
    seamen_df = get_seamen_as_data()

    data_candidate = request.json
    bagian = data_candidate["BAGIAN"]
    vessel_name = data_candidate["VESSEL"]
    rank = data_candidate["RANK"]
    certificate = data_candidate["CERTIFICATE"]
    age_range = (data_candidate["UMUR"], data_candidate["UMUR"])

    # Call getRecommendation with fresh data
    recommendations = getRecommendation(
        seamen_df, data_candidate, bagian, vessel_name, rank, certificate, age_range
    )
    result = recommendations.to_dict(orient="records")
    return jsonify(result)


@app.route("/api/save-excel", methods=["POST"])
def save_excel():
    data = request.get_json()
    try:
        df = pd.DataFrame(data)

        # Tentukan root project (folder spm-react-main)
        base_dir = pathlib.Path(
            __file__
        ).parent.parent.resolve()  # ke dua tingkat atas dari app.py
        data_dir = base_dir / "data"

        # Buat folder data jika belum ada
        data_dir.mkdir(parents=True, exist_ok=True)

        save_path = data_dir / "seaman_selected.xlsx"
        df.to_excel(save_path, index=False)

        return jsonify({"status": "success", "message": "File berhasil disimpan!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/filter_history", methods=["GET"])
def filter_history():
    allowed_status = [
        "PENDING CUTI",
        "PENDING GAJI",
        "DARAT BIASA",
        "DARAT",
        "DARAT STAND-BY",
    ]

    try:
        # Ganti Excel dengan fetch dari database
        df_history = get_mutations_as_data()  # Ini fungsi yang sudah ada
        df_seamen = get_seamen_as_data()  # Untuk ambil nama

        # Merge untuk dapat nama
        df = df_history.merge(
            df_seamen[["seamancode", "name"]].drop_duplicates(),
            on="seamancode",
            how="left",
        )

        # Cek kolom wajib - sesuaikan dengan struktur data Anda
        if "seamancode" not in df.columns:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Kolom 'seamancode' tidak ditemukan.",
                    }
                ),
                400,
            )

        # Ambil parameter group kapal dari frontend
        group_vessels = request.args.getlist("group")

        # Group by seamancode untuk gabungkan history
        grouped = (
            df.groupby("seamancode")
            .agg(
                {
                    "name": "first",
                    "fromvesselname": lambda x: x.dropna().tolist(),  # Collect all vessels
                }
            )
            .reset_index()
        )

        result = []

        for _, row in grouped.iterrows():
            history_vessels = row.get("fromvesselname", [])

            # Filter allowed_status dari history
            filtered_vessels = [v for v in history_vessels if v not in allowed_status]

            # Hitung match dengan group
            match_count = sum(1 for v in filtered_vessels if v in group_vessels)

            # Join jadi string
            history_str = ", ".join(filtered_vessels)

            # Lihat last location
            last_location = df_seamen[df_seamen["seamancode"] == row["seamancode"]][
                "last_location"
            ].values

            result.append(
                {
                    "seamancode": row.get("seamancode", ""),
                    "name": row.get("name", ""),
                    "history": history_str,
                    "matchCount": match_count,
                    "last_location": last_location[0] if len(last_location) > 0 else "",
                }
            )

        return jsonify({"status": "success", "data": result, "count": len(result)})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# BAGIAN 6: LOCKED ROTATIONS MANAGEMENT
# ============================================================================


@app.route("/api/locked-rotations", methods=["GET"])
def api_get_locked_rotations():
    """Get all locked rotations for a specific job and vessel"""
    try:
        job = request.args.get("job", "").upper()
        vessel = request.args.get("vessel", "").upper()

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        # Fetch dari database menggunakan fungsi di database.py
        # vessel is optional - if provided, filter by both job and vessel
        locked_data = get_locked_rotations(job=job, vessel=vessel if vessel else None)

        return jsonify({"status": "success", "data": locked_data})

    except Exception as e:
        app.logger.error(f"Error fetching locked rotations: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/locked-rotations", methods=["POST"])
def api_save_locked_rotation():
    """Save a locked rotation"""
    try:
        data = request.get_json()

        # Validasi required fields
        required_fields = [
            "groupKey",
            "job",
            "vessel",
            "scheduleTable",
            "nahkodaTable",
            "lockedSeamanCodes",
        ]
        for field in required_fields:
            if field not in data:
                return (
                    jsonify({"status": "error", "message": f"Field {field} required"}),
                    400,
                )

        group_key = data["groupKey"]
        job = data["job"].upper()
        vessel = data["vessel"].upper()
        categorization = (
            data.get("categorization", "").lower()
            if data.get("categorization")
            else None
        )
        schedule_table = data["scheduleTable"]
        nahkoda_table = data["nahkodaTable"]
        darat_table = data.get("daratTable")
        locked_seaman_codes = data["lockedSeamanCodes"]
        locked_by = data.get("lockedBy")  # Optional: user info

        # Validasi seaman codes adalah list
        if not isinstance(locked_seaman_codes, list):
            return (
                jsonify(
                    {"status": "error", "message": "lockedSeamanCodes must be an array"}
                ),
                400,
            )

        # Simpan ke database menggunakan fungsi di database.py
        result = save_locked_rotation(
            group_key=group_key,
            job=job,
            vessel=vessel,
            schedule_data=schedule_table,
            crew_data=nahkoda_table,
            reliever_data=darat_table,
            locked_seaman_codes=locked_seaman_codes,
            locked_by=locked_by,
            categorization=categorization,
        )

        return jsonify(
            {"status": "success", "message": result["message"], "id": result.get("id")}
        )

    except Exception as e:
        app.logger.error(f"Error saving locked rotation: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/locked-rotations/<group_key>", methods=["DELETE"])
def api_unlock_rotation(group_key):
    """Unlock a rotation"""
    try:
        job = request.args.get("job", "").upper()
        vessel = request.args.get("vessel", "").upper()

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        if not vessel:
            return (
                jsonify({"status": "error", "message": "Vessel parameter required"}),
                400,
            )

        # Unlock menggunakan fungsi di database.py
        result = unlock_rotation(group_key=group_key, job=job, vessel=vessel)

        if result["success"]:
            return jsonify({"status": "success", "message": result["message"]})
        else:
            return jsonify({"status": "error", "message": result["message"]}), 404

    except Exception as e:
        app.logger.error(f"Error unlocking rotation: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/submit-rotations", methods=["POST"])
def api_submit_all_rotations():
    """Submit all locked rotations untuk job tertentu"""
    try:
        data = request.get_json()
        job = data.get("job", "").upper()
        categorization = data.get("categorization")

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        # Submit rotations menggunakan fungsi di database.py
        result = submit_all_rotations(job=job, categorization=categorization)

        if result["success"]:
            return jsonify(
                {
                    "status": "success",
                    "message": result["message"],
                    "submitted_count": result["submitted_count"],
                    "apollo_success": result.get("apollo_success", 0),
                    "apollo_failed": result.get("apollo_failed", 0),
                }
            )
        else:
            return jsonify({"status": "error", "message": result["message"]}), 400

    except Exception as e:
        app.logger.error(f"Error submitting rotations: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# BAGIAN 7: ROTATION SUBMISSIONS & STATUS
# ============================================================================


@app.route("/api/rotation-submissions", methods=["GET"])
def api_get_rotation_submissions():
    """Get all rotation submissions (excluding soft-deleted)"""
    try:
        job = request.args.get("job", None)
        if job:
            job = job.upper()

        submissions = get_rotation_submissions(job=job)

        return jsonify(
            {"status": "success", "data": submissions, "count": len(submissions)}
        )

    except Exception as e:
        app.logger.error(f"Error fetching rotation submissions: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/all-rotation-submissions", methods=["GET"])
def api_get_all_rotation_submissions():
    """Get ALL rotation submissions including soft-deleted ones"""
    try:
        job = request.args.get("job", None)
        if job:
            job = job.upper()

        submissions = get_all_rotation_submissions(job=job)

        return jsonify(
            {"status": "success", "data": submissions, "count": len(submissions)}
        )

    except Exception as e:
        app.logger.error(f"Error fetching all rotation submissions: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/check-job-submitted", methods=["GET"])
def api_check_job_submitted():
    """Check if job has been submitted"""
    try:
        job = request.args.get("job", "").upper()
        vessel = request.args.get("vessel", "").upper()
        categorization = (
            request.args.get("categorization", "").lower()
            if request.args.get("categorization")
            else None
        )

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        # Allow either vessel or categorization (for Junior rotation)
        if not vessel and not categorization:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Vessel or categorization parameter required",
                    }
                ),
                400,
            )

        is_submitted = check_job_submitted(
            job=job, vessel=vessel if vessel else None, categorization=categorization
        )

        return jsonify({"status": "success", "is_submitted": is_submitted})

    except Exception as e:
        app.logger.error(f"Error checking job submission: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/check-pending-changes", methods=["GET"])
def api_check_pending_changes():
    """
    Check if there are pending changes (status CHANGE with is_active FALSE)
    that need to be resubmitted
    """
    try:
        job = request.args.get("job", "").upper()
        vessel = request.args.get("vessel", "").upper()
        categorization = (
            request.args.get("categorization", "").lower()
            if request.args.get("categorization")
            else None
        )

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        # Allow either vessel or categorization (for Junior rotation)
        if not vessel and not categorization:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Vessel or categorization parameter required",
                    }
                ),
                400,
            )

        result = check_has_pending_changes(
            job=job, vessel=vessel if vessel else None, categorization=categorization
        )

        return jsonify(
            {
                "status": "success",
                "has_changes": result["has_changes"],
                "count": result["count"],
                "affected_groups": result["affected_groups"],
            }
        )

    except Exception as e:
        app.logger.error(f"Error checking pending changes: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/locked_seaman_codes", methods=["GET"])
def api_get_locked_seaman_codes():
    """Get all locked seaman codes for filtering"""
    try:
        job = request.args.get("job", "").upper()

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        # Fetch locked codes menggunakan fungsi di database.py
        locked_codes = get_all_locked_seaman_codes(job=job)

        return jsonify(
            {"status": "success", "data": locked_codes, "count": len(locked_codes)}
        )

    except Exception as e:
        app.logger.error(f"Error fetching locked seaman codes: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/submitted_seaman_codes", methods=["GET"])
def api_get_submitted_seaman_codes():
    """
    Get all submitted seaman codes for filtering

    Returns seamancodes yang sudah di-submit dengan status aktif (PENDING/CHANGE/ACCEPTED)
    dan tanggal_ready belum lewat. Seamancodes ini harus di-exclude dari selection.
    """
    try:
        job = request.args.get("job", "").upper()

        if not job:
            return (
                jsonify({"status": "error", "message": "Job parameter required"}),
                400,
            )

        # Fetch submitted codes menggunakan fungsi di database.py
        submitted_codes = get_submitted_seamancodes(job=job)

        return jsonify(
            {
                "status": "success",
                "data": submitted_codes,
                "count": len(submitted_codes),
            }
        )

    except Exception as e:
        app.logger.error(f"Error fetching submitted seaman codes: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# BAGIAN 8: CREW RELIEF & REPLACEMENT
# ============================================================================


@app.route("/api/get_crew_to_relieve", methods=["GET"])
def api_get_crew_to_relieve():
    """Get crew members that need to be relieved (day_remains < threshold OR day_elapsed > threshold)"""
    try:
        vessel_group = request.args.get("vessel_group", "")
        job = request.args.get("job", "").upper()
        days_threshold = int(request.args.get("days_threshold", 30))  # Default 30 hari
        days_elapsed_threshold = int(
            request.args.get("days_elapsed_threshold", 335)
        )  # Default 335 hari (1 bulan sebelum kontrak habis)

        if not vessel_group or not job:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "vessel_group and job parameters required",
                    }
                ),
                400,
            )

        # Parse vessel_group - bisa comma-separated string dari FE
        # Split dan normalize vessel names
        vessel_list = [v.strip().upper() for v in vessel_group.split(",")]

        # Fetch all seamen data (no job parameter)
        df_seamen = get_seamen_as_data()

        # Filter by job and convert to dict
        all_seamen = df_seamen[df_seamen["last_position"] == job].to_dict(
            orient="records"
        )

        # Filter crew yang perlu diganti
        crew_to_relieve = []
        for seaman in all_seamen:
            # Parse day_remains and day_elapsed - handle string, int, and None
            day_remains_raw = seaman.get("day_remains")
            try:
                if day_remains_raw is None or day_remains_raw == "":
                    day_remains = 999
                else:
                    day_remains = int(float(str(day_remains_raw)))
            except (ValueError, TypeError):
                day_remains = 999

            day_elapsed_raw = seaman.get("day_elapsed")
            try:
                if day_elapsed_raw is None or day_elapsed_raw == "":
                    day_elapsed = 0
                else:
                    day_elapsed = int(float(str(day_elapsed_raw)))
            except (ValueError, TypeError):
                day_elapsed = 0

            # Check conditions
            is_on_board = seaman.get("status", "").upper() == "ON BOARD"
            needs_relief_by_remains = day_remains <= days_threshold  # <= 30 hari
            needs_relief_by_elapsed = (
                day_elapsed >= days_elapsed_threshold
            )  # >= 335 hari
            vessel_name = seaman.get("last_location", "").upper()

            # Check if vessel belongs to the group
            # Exact match atau partial match
            in_vessel_group = any(
                vessel in vessel_name or vessel_name in vessel for vessel in vessel_list
            )

            # Crew needs relief if EITHER condition is met
            if (
                is_on_board
                and (needs_relief_by_remains or needs_relief_by_elapsed)
                and in_vessel_group
            ):
                crew_to_relieve.append(
                    {
                        "seamancode": seaman.get("seamancode"),
                        "seafarercode": seaman.get("seafarercode"),
                        "name": seaman.get("name"),
                        "age": seaman.get("age"),
                        "birthdate": seaman.get("birthdate"),
                        "birthplace": seaman.get("birthplace"),
                        "currentVessel": seaman.get("last_location"),
                        "currentVesselId": seaman.get("last_vesselid"),
                        "currentPosition": seaman.get("last_position"),
                        "certificate": seaman.get("certificate"),
                        "experience": seaman.get("experience"),
                        "fleet": seaman.get("fleet"),
                        "startDate": seaman.get("start_date"),
                        "endDate": seaman.get("end_date"),
                        "daysElapsed": day_elapsed,
                        "daysRemaining": day_remains,
                        "phoneNumber1": seaman.get("phone_number_1"),
                        "phoneNumber2": seaman.get("phone_number_2"),
                        "phoneNumber3": seaman.get("phone_number_3"),
                        "phoneNumber4": seaman.get("phone_number_4"),
                        "picCrewing": seaman.get("pic_crewing"),
                        "prevLocation": seaman.get("prevlocation"),
                        "prevPosition": seaman.get("prevposition"),
                        "reliefReason": (
                            "elapsed" if needs_relief_by_elapsed else "remaining"
                        ),
                        "reliefPriority": (
                            "critical"
                            if (day_remains < 7 or day_elapsed > 358)
                            else (
                                "high"
                                if (day_remains < 30 or day_elapsed > 335)
                                else "medium"
                            )
                        ),
                    }
                )

        # Sort by priority: critical first, then by days remaining (ascending), then by days elapsed (descending)
        def sort_key(x):
            priority_order = {"critical": 0, "high": 1, "medium": 2}
            return (
                priority_order.get(x["reliefPriority"], 3),
                x["daysRemaining"],
                -x["daysElapsed"],
            )

        crew_to_relieve.sort(key=sort_key)

        return jsonify(
            {
                "status": "success",
                "data": crew_to_relieve,
                "count": len(crew_to_relieve),
                "vessel_group": vessel_group,
                "vessel_count": len(vessel_list),
                "job": job,
                "days_threshold": days_threshold,
                "days_elapsed_threshold": days_elapsed_threshold,
                "critical_count": sum(
                    1 for x in crew_to_relieve if x["reliefPriority"] == "critical"
                ),
                "high_count": sum(
                    1 for x in crew_to_relieve if x["reliefPriority"] == "high"
                ),
                "medium_count": sum(
                    1 for x in crew_to_relieve if x["reliefPriority"] == "medium"
                ),
            }
        )

    except Exception as e:
        app.logger.error(f"Error fetching crew to relieve: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/get_available_replacements", methods=["GET"])
def api_get_available_replacements():
    """Get available crew members for replacement from next group with SAME rank OR promotion from lower rank"""
    try:
        job = request.args.get("job", "").upper()
        vessel_group = request.args.get(
            "vessel_group", ""
        )  # e.g., "container_rotation1"
        next_group = request.args.get("next_group", "")  # e.g., "container_rotation2"
        next_group_vessels_str = request.args.get(
            "next_group_vessels", ""
        )  # e.g., "KM. SHIP1,KM. SHIP2"
        day_elapsed_threshold = int(request.args.get("day_elapsed_threshold", 0))

        if not job:
            return (
                jsonify({"status": "error", "message": "job parameter required"}),
                400,
            )

        if not vessel_group:
            return (
                jsonify(
                    {"status": "error", "message": "vessel_group parameter required"}
                ),
                400,
            )

        if not next_group_vessels_str:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "next_group_vessels parameter required",
                    }
                ),
                400,
            )

        # Parse next group vessels from comma-separated string
        next_group_vessels = [
            v.strip() for v in next_group_vessels_str.split(",") if v.strip()
        ]

        if not next_group_vessels:
            return (
                jsonify(
                    {"status": "error", "message": "next_group_vessels cannot be empty"}
                ),
                400,
            )

        # Fetch all seamen data
        df_seamen = get_seamen_as_data()

        # Define available last_location values (status khusus)
        AVAILABLE_LAST_LOCATIONS = [
            "PENDING CUTI",
            "PENDING GAJI",
            "DARAT BIASA",
            "DARAT",
            "DARAT STAND-BY",
        ]

        available_replacements = []

        # ============================================================
        # PART 1: Same Job Replacements
        # ============================================================
        df_same_job = df_seamen[df_seamen["last_position"] == job]

        for _, seaman in df_same_job.iterrows():
            last_location = seaman.get("last_location", "").upper()
            prev_location = seaman.get("prevlocation", "").upper()
            status = seaman.get("status", "").upper()

            # Last location MUST be in AVAILABLE_LAST_LOCATIONS (status khusus)
            if last_location not in AVAILABLE_LAST_LOCATIONS:
                continue

            # Previous location (kapal terakhir sebelum status khusus) MUST be in next_group_vessels
            is_in_next_group = any(
                vessel.upper() in prev_location or prev_location in vessel.upper()
                for vessel in next_group_vessels
            )

            if not is_in_next_group:
                continue

            # Parse day_elapsed
            try:
                day_elapsed = int(seaman.get("day_elapsed", "0"))
            except (ValueError, TypeError):
                day_elapsed = 0

            # MUST have day_elapsed < 15 (baru istirahat)
            if day_elapsed >= 15:
                continue

            # Check if day_elapsed is greater than threshold
            if day_elapsed < day_elapsed_threshold:
                continue

            # Add to replacements
            available_replacements.append(
                {
                    "seamancode": seaman.get("seamancode"),
                    "name": seaman.get("name"),
                    "position": seaman.get("last_position"),
                    "lastVessel": last_location,
                    "status": status,
                    "certificate": seaman.get("certificate"),
                    "experience": seaman.get("experience"),
                    "phoneNumber": seaman.get("phone_number_3")
                    or seaman.get("phone_number_1"),
                    "age": seaman.get("age"),
                    "daysSinceLastVessel": day_elapsed,
                    "replacementType": "same_rank",
                }
            )

        # ============================================================
        # PART 2: Promotion Candidates (Optional - jika frontend kirim)
        # ============================================================
        promotion_vessels_str = request.args.get("promotion_vessels", "")
        promotion_job = request.args.get("promotion_job", "").upper()

        if promotion_vessels_str and promotion_job:
            promotion_vessels = [
                v.strip() for v in promotion_vessels_str.split(",") if v.strip()
            ]

            if promotion_vessels:
                df_promotion = df_seamen[df_seamen["last_position"] == promotion_job]

                for _, seaman in df_promotion.iterrows():
                    last_location = seaman.get("last_location", "").upper()
                    prev_location = seaman.get("prevlocation", "").upper()
                    status = seaman.get("status", "").upper()

                    # Last location MUST be in AVAILABLE_LAST_LOCATIONS
                    if last_location not in AVAILABLE_LAST_LOCATIONS:
                        continue

                    # Previous location MUST be in promotion_vessels
                    is_in_promotion_group = any(
                        vessel.upper() in prev_location
                        or prev_location in vessel.upper()
                        for vessel in promotion_vessels
                    )

                    if not is_in_promotion_group:
                        continue

                    # Parse day_elapsed
                    try:
                        day_elapsed = int(seaman.get("day_elapsed", "0"))
                    except (ValueError, TypeError):
                        day_elapsed = 0

                    # MUST have day_elapsed < 15
                    if day_elapsed >= 15:
                        continue

                    # Check threshold
                    if day_elapsed < day_elapsed_threshold:
                        continue

                    # Add to replacements with promotion flag
                    available_replacements.append(
                        {
                            "seamancode": seaman.get("seamancode"),
                            "name": seaman.get("name"),
                            "position": seaman.get("last_position"),
                            "lastVessel": last_location,
                            "status": status,
                            "certificate": seaman.get("certificate"),
                            "experience": seaman.get("experience"),
                            "phoneNumber": seaman.get("phone_number_3")
                            or seaman.get("phone_number_1"),
                            "age": seaman.get("age"),
                            "daysSinceLastVessel": day_elapsed,
                            "replacementType": "promotion",
                            "promotionFrom": promotion_job,
                            "promotionTo": job,
                        }
                    )

        # ============================================================
        # SORTING
        # ============================================================
        def last_location_priority(replacement):
            """Priority: DARAT STAND-BY > DARAT BIASA/DARAT > PENDING GAJI > PENDING CUTI"""
            location = replacement["lastVessel"].upper()
            if "DARAT STAND-BY" in location:
                return 0
            elif "DARAT BIASA" in location or "DARAT" in location:
                return 1
            elif "PENDING GAJI" in location:
                return 2
            elif "PENDING CUTI" in location:
                return 3
            else:
                return 4

        def replacement_type_priority(replacement):
            """Priority: same_rank > promotion"""
            return 0 if replacement.get("replacementType") == "same_rank" else 1

        # Sort by: replacement type -> location priority -> day elapsed (descending)
        available_replacements.sort(
            key=lambda x: (
                replacement_type_priority(x),
                last_location_priority(x),
                -x["daysSinceLastVessel"],
            )
        )

        # ============================================================
        # RESPONSE
        # ============================================================
        return jsonify(
            {
                "status": "success",
                "data": available_replacements,
                "count": len(available_replacements),
                "summary": {
                    "same_rank_count": sum(
                        1
                        for r in available_replacements
                        if r.get("replacementType") == "same_rank"
                    ),
                    "promotion_count": sum(
                        1
                        for r in available_replacements
                        if r.get("replacementType") == "promotion"
                    ),
                },
                "job": job,
                "vessel_group": vessel_group,
                "next_group": next_group,
                "next_group_vessels": next_group_vessels,
                "promotion_job": promotion_job if promotion_job else None,
                "day_elapsed_threshold": day_elapsed_threshold,
            }
        )

    except Exception as e:
        app.logger.error(f"Error fetching available replacements: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# BAGIAN 9: SCHEDULE ROTATION OPERATIONS
# ============================================================================


@app.route("/api/submit_schedule_rotation", methods=["POST"])
def api_submit_schedule_rotation():
    """Submit schedule rotation assignments"""
    try:
        data = request.get_json()

        if not data or "rotations" not in data:
            return (
                jsonify({"status": "error", "message": "rotations data required"}),
                400,
            )

        rotations = data.get("rotations", [])
        vessel_group = data.get("vessel_group", "")
        job = data.get("job", "")
        rotation_type = data.get("type", "")
        rotation_part = data.get("part", "")

        # Validate rotations
        if not rotations:
            return (
                jsonify({"status": "error", "message": "No rotation data provided"}),
                400,
            )

        # Process each rotation
        processed_rotations = []
        failed_rotations = []

        for rotation in rotations:
            crew_out_code = rotation.get("seamancode_out")
            crew_in_code = rotation.get("seamancode_in")
            vessel = rotation.get("vessel")
            position = rotation.get("position")
            days_remaining = rotation.get("days_remaining", 0)

            if not all([crew_out_code, crew_in_code, vessel, position]):
                failed_rotations.append(
                    {"rotation": rotation, "reason": "Missing required fields"}
                )
                continue

            try:
                # Di sini Anda bisa simpan ke database
                rotation_data = {
                    "crew_out": crew_out_code,
                    "crew_in": crew_in_code,
                    "vessel": vessel,
                    "position": position,
                    "days_remaining": days_remaining,
                    "vessel_group": vessel_group,
                    "job": job,
                    "type": rotation_type,
                    "part": rotation_part,
                    "status": "PENDING",
                    "created_at": datetime.now().isoformat(),
                    "created_by": "system",  # Bisa diganti dengan user login
                }

                # TODO: Insert to database
                # insert_schedule_rotation(rotation_data)

                processed_rotations.append(rotation_data)

            except Exception as e:
                failed_rotations.append({"rotation": rotation, "reason": str(e)})

        return jsonify(
            {
                "status": "success",
                "message": f"Successfully processed {len(processed_rotations)} rotations",
                "data": {
                    "processed": processed_rotations,
                    "failed": failed_rotations,
                    "total_processed": len(processed_rotations),
                    "total_failed": len(failed_rotations),
                },
                "vessel_group": vessel_group,
                "job": job,
            }
        )

    except Exception as e:
        app.logger.error(f"Error submitting schedule rotation: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/get_rotation_summary", methods=["GET"])
def api_get_rotation_summary():
    """Get summary of rotation schedule for a vessel group"""
    try:
        vessel_group = request.args.get("vessel_group", "")
        job = request.args.get("job", "").upper()

        if not vessel_group or not job:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "vessel_group and job parameters required",
                    }
                ),
                400,
            )

        # Parse vessel_group
        vessel_list = [v.strip().upper() for v in vessel_group.split(",")]

        # Get crew data (no job parameter)
        df_seamen = get_seamen_as_data()

        # Filter by job and convert to dict
        all_seamen = df_seamen[df_seamen["last_position"] == job].to_dict(
            orient="records"
        )

        total_crew = 0
        needs_relief_30 = 0
        needs_relief_60 = 0
        needs_relief_90 = 0
        critical_relief = 0  # < 7 days

        for seaman in all_seamen:
            vessel_name = seaman.get("last_location", "").upper()

            # Check if vessel in group
            in_vessel_group = any(
                vessel in vessel_name or vessel_name in vessel for vessel in vessel_list
            )

            if in_vessel_group and seaman.get("status", "").upper() == "ON BOARD":
                total_crew += 1
                try:
                    day_remains = int(seaman.get("day_remains", "999"))
                    if day_remains < 90:
                        needs_relief_90 += 1
                    if day_remains < 60:
                        needs_relief_60 += 1
                    if day_remains < 30:
                        needs_relief_30 += 1
                    if day_remains < 7:
                        critical_relief += 1
                except (ValueError, TypeError):
                    pass

        return jsonify(
            {
                "status": "success",
                "data": {
                    "vessel_group": vessel_group,
                    "vessel_count": len(vessel_list),
                    "job": job,
                    "total_crew": total_crew,
                    "needs_relief_30_days": needs_relief_30,
                    "needs_relief_60_days": needs_relief_60,
                    "needs_relief_90_days": needs_relief_90,
                    "critical_relief": critical_relief,
                    "relief_percentage_30": round(
                        (needs_relief_30 / total_crew * 100) if total_crew > 0 else 0, 2
                    ),
                    "relief_percentage_60": round(
                        (needs_relief_60 / total_crew * 100) if total_crew > 0 else 0, 2
                    ),
                    "relief_percentage_90": round(
                        (needs_relief_90 / total_crew * 100) if total_crew > 0 else 0, 2
                    ),
                },
            }
        )

    except Exception as e:
        app.logger.error(f"Error fetching rotation summary: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# BAGIAN 10: ROTATION vesselS (CRUD)
# ============================================================================


@app.route("/api/rotation-vessels", methods=["GET"])
def api_get_rotation_vessels():
    """GET - Ambil semua rotation vessels"""
    try:
        rotation_type = request.args.get("type")  # Optional filter
        categorization = request.args.get("categorization")  # Optional filter
        vessels = get_rotation_vessels(rotation_type, categorization)
        return jsonify(vessels), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rotation-vessels/<int:vessel_id>", methods=["GET"])
def api_get_rotation_vessel(vessel_id):
    """GET - Ambil single rotation vessel by ID"""
    try:
        vessel = get_rotation_vessel_by_id(vessel_id)

        if vessel:
            return jsonify(vessel), 200
        else:
            return jsonify({"error": "vessel not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rotation-vessels", methods=["POST"])
def api_create_rotation_vessel():
    """POST - Create new rotation vessel"""
    try:
        data = request.json

        # Validasi required fields
        required_fields = ["job_title", "vessel", "type", "part", "groups"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        result = create_rotation_vessel(
            job_title=data["job_title"],
            vessel=data["vessel"],
            rotation_type=data["type"],
            part=data["part"],
            groups=data["groups"],
            categorization=data.get("categorization", "container"),
        )

        return jsonify(result), 201

    except ValueError as e:  # ✅ TAMBAHKAN INI - Handle validation errors
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rotation-vessels/<int:vessel_id>", methods=["PUT"])
def api_update_rotation_vessel(vessel_id):
    """PUT - Update existing rotation vessel"""
    try:
        data = request.json

        # Validasi required fields
        required_fields = ["job_title", "vessel", "type", "part", "groups"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        result = update_rotation_vessel(
            vessel_id=vessel_id,
            job_title=data["job_title"],
            vessel=data["vessel"],
            rotation_type=data["type"],
            part=data["part"],
            groups=data["groups"],
            categorization=data.get("categorization"),
        )

        return jsonify(result), 200

    except ValueError as e:  # ✅ TAMBAHKAN INI - Handle validation errors
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rotation-vessels/<int:vessel_id>", methods=["DELETE"])
def api_delete_rotation_vessel(vessel_id):
    """DELETE - Delete rotation vessel"""
    try:
        result = delete_rotation_vessel(vessel_id)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/vessel-categories", methods=["GET"])
def api_vessel_categories():
    """
    GET - Flat ship lists per categorization, dipakai frontend untuk
    mengklasifikasikan kapal (container/manalagi/bc).

    Returns:
        dict: { "container": [...], "manalagi": [...], "bc": [...] }
    """
    try:
        from repositories.vessel_repository import build_kelompok

        kelompok = build_kelompok()
        # Hanya kembalikan kategori yang dikelola DB (bukan mt/tb/tk/others)
        managed_categories = {
            k: v
            for k, v in kelompok.items()
            if k not in ("mt", "tb", "tk", "others")
        }
        return jsonify(managed_categories), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# BAGIAN 11: CHANGE SCHEDULE ROTATION (TIM PUSAT)
# ============================================================================


@app.route("/api/change-schedule-rotation", methods=["POST"])
def api_change_schedule_rotation():
    """
    POST - API untuk tim pusat mengirim request perubahan schedule rotation

    Request body (dari tim pusat):
    {
        "seamencode": "12345",
        "tanggalready": "25-12-2025",
        "statusdata": "CHANGE",
        "stage": "STAGE_1"
    }

    Response:
    {
        "success": true,
        "message": "Status updated successfully. 12345 set to CHANGE, 5 others set to ACCEPTED.",
        "changed_seamancode": "12345",
        "tanggal_ready": "25-12-2025",
        "accepted_count": 5,
        "job": "NAKHODA",
        "group_key": "container_rotation1",
        "stage": "STAGE_1",
        "auto_accepted_info": {
            "auto_accepted_count": 2
        },
        "email_notification": {
            "success": true,
            "sent_count": 3
        }
    }
    """
    try:
        from utils.email_notifier import send_rotation_change_notification

        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Map parameter names dari tim pusat ke internal naming
        seamancode = data.get("seamencode") or data.get("seamanCode")
        tanggal_ready = data.get("tanggalready") or data.get("tanggalReady")
        status_data = data.get("statusdata") or data.get("statusData")
        stage = data.get("stage")

        if not seamancode:
            return jsonify({"error": "Missing required field: seamencode"}), 400

        if not tanggal_ready:
            return jsonify({"error": "Missing required field: tanggalready"}), 400

        if not status_data or status_data != "CHANGE":
            return (
                jsonify(
                    {"error": "Missing or invalid statusdata field. Must be 'CHANGE'"}
                ),
                400,
            )

        # NOTE: stage is optional (v1 may not send it, v2 will send it)

        # 1. Auto-accept expired rotations first
        auto_accept_result = auto_accept_expired_rotations()

        # 2. Update rotation status
        result = update_rotation_status_change(seamancode, tanggal_ready, stage)

        if result["success"]:
            # Include auto-accept info in response
            result["auto_accepted_info"] = {
                "auto_accepted_count": auto_accept_result.get("auto_accepted_count", 0)
            }

            # 3. Send email notification to divisions
            # Get additional info (nama, mutation_to) from result
            try:
                # Fetch rotation details untuk email
                from database.connection import get_rotation_submissions

                submissions = get_rotation_submissions()
                target_submission = next(
                    (s for s in submissions if s["seamancode"] == seamancode), None
                )

                if target_submission:
                    email_result = send_rotation_change_notification(
                        seamancode=seamancode,
                        nama=target_submission.get("nama", "Unknown"),
                        job=result.get("job", "Unknown"),
                        group_key=result.get("group_key", "Unknown"),
                        mutation_to=target_submission.get("mutation_to", "Unknown"),
                        tanggal_ready=tanggal_ready,
                        status_data=status_data,
                    )

                    result["email_notification"] = {
                        "success": email_result.get("success", False),
                        "sent_count": email_result.get("sent_count", 0),
                        "message": email_result.get("message", ""),
                    }

                    print(f"DONE - Email notification: {email_result.get('message')}")
                else:
                    result["email_notification"] = {
                        "success": False,
                        "sent_count": 0,
                        "message": "Submission details not found for email",
                    }

            except Exception as e:
                # Email error shouldn't fail the entire request
                print(f"WARNING - Email notification failed: {str(e)}")
                result["email_notification"] = {
                    "success": False,
                    "sent_count": 0,
                    "message": f"Email error: {str(e)}",
                }

            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except ValueError as e:
        # Validation error (e.g., invalid date format)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# BAGIAN 12: SOFT DELETE & RESET (NEXT BATCH)
# ============================================================================


@app.route("/api/soft-delete-rotation", methods=["POST"])
def api_soft_delete_rotation():
    """
    POST - API untuk soft delete SEMUA rotation submission dan reset SEMUA locked schedules

    Request body: {} (tidak perlu parameter)

    Response:
    {
        "success": true,
        "message": "Successfully soft deleted ALL 25 rotation(s) and reset ALL 48 locked schedule(s)",
        "deleted_count": 25,
        "reset_count": 48
    }
    """
    try:
        from database.connection import soft_delete_rotation_and_reset_locks

        # Execute soft delete and reset ALL
        result = soft_delete_rotation_and_reset_locks()

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Use port from environment variable if available, otherwise default to 5000
    # Note: docker-compose maps host:18037 to container:5000
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    host = "0.0.0.0"
    print(f"Flask app running on port {port}")

    app.run(debug=True, port=port, host=host)
