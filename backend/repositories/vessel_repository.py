"""
Module ini menangani akses data konfigurasi grup kapal dari database,
termasuk pembangunan KELOMPOK dan mapping vessel group untuk rotasi kapal.
"""

from database.connection import get_rotation_vessels

_STATIC_KELOMPOK = {
    "mt": ["MT. GLOBAL", "MT. PANTAI LAMONG"],
    "tb": [
        "TB. ALPHA",
        "TB. CAPUNG I",
        "TB. CAPUNG II",
        "TB. CAPUNG III",
        "TB. GAMMA SATU",
        "TB. MANGGA RAYA",
        "TB. SPIL BOAT",
        "TB. TOYO",
        "TB. YITNA YUWANA",
        "TB. YUSHIN MARU",
    ],
    "tk": ["TK. BETA SATU", "TK. DELTA DUA"],
    "others": [
        "DARAT",
        "DARAT BIASA",
        "DARAT STAND-BY",
        "PENDING CUTI",
        "PENDING GAJI",
        "PENDING GAJI CUTI",
    ],
}


def build_kelompok() -> dict:
    """
    Build KELOMPOK dict dari DB (container/manalagi/bc) digabung dengan
    static entries (mt/tb/tk/others yang belum masuk vessel management).

    KELOMPOK dipakai oleh filter_in_vessel() untuk memfilter seamen
    berdasarkan kapal yang mereka tempati (last_location).

    Returns:
        dict: { categorization: [ship_names] }
    """
    try:
        vessels = get_rotation_vessels()
        db_kelompok: dict = {}
        for v in vessels:
            cat = v["categorization"]
            if cat not in db_kelompok:
                db_kelompok[cat] = set()
            for ships in v["groups"].values():
                db_kelompok[cat].update(ships)
        db_kelompok = {cat: sorted(ships) for cat, ships in db_kelompok.items()}
        return {**db_kelompok, **_STATIC_KELOMPOK}
    except Exception as e:
        print(f"WARN - Could not load kelompok from DB, using static only: {e}")
        return dict(_STATIC_KELOMPOK)


def get_vessel_config_from_db(categorization: str, part: str) -> tuple:
    """
    Ambil prefix dan groups mapping dari DB untuk dipakai vessel_group_id_deck().

    Field 'vessel' di DB menyimpan prefix grup (D/E/F/G):
        container + deck   → vessel='D' → group IDs: D1, D2, ...
        container + engine → vessel='E' → group IDs: E1, E2, ...
        manalagi  + deck   → vessel='F' → group IDs: F1, F2, ...
        manalagi  + engine → vessel='G' → group IDs: G1, G2, ...

    Args:
        categorization: e.g. 'container', 'manalagi'
        part: 'deck' atau 'engine'

    Returns:
        tuple: (prefix, groups_dict)
            prefix      — e.g. 'D', 'E', 'F', 'G'
            groups_dict — e.g. {'container_rotation1': ['KM. ...'], ...}
        Atau (None, {}) jika tidak ditemukan di DB.
    """
    try:
        vessels = get_rotation_vessels(categorization=categorization)
        for v in vessels:
            if v["part"] == part:
                return v["vessel"], v["groups"]
        print(
            f"WARN - No vessel config found for categorization='{categorization}' part='{part}'"
        )
        return None, {}
    except Exception as e:
        print(f"WARN - Could not load vessel config from DB: {e}")
        return None, {}
