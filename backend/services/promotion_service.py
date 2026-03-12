"""
Promotion Service
Handles business logic for promotion candidates (kenaikan pangkat).
"""

from datetime import datetime, timedelta, timezone

import pandas as pd

from repositories import get_mutations_data, get_seamen_data
from repositories.vessel_repository import build_kelompok

_LOKASI_OTHERS_UPPER = frozenset([
    "DARAT", "DARAT BIASA", "DARAT STAND-BY", "STAND BY CREW", "PENDING CUTI", "PENDING GAJI",
])


def _apply_categorization_filter(
    df_seamen: pd.DataFrame, categorization: str | None
) -> pd.DataFrame:
    """
    Filter seamen by vessel category (container/manalagi).

    Uses last_location for vessel crew, prevlocation for darat/pending crew.
    Crew with no determinable category are included (lenient).
    Vessel lists sourced from DB via build_kelompok() for accuracy.
    """
    if not categorization:
        return df_seamen

    kelompok = build_kelompok()
    manalagi_set = frozenset(v.upper() for v in kelompok.get("manalagi", []))
    container_set = frozenset(v.upper() for v in kelompok.get("container", []))
    bc_set = frozenset(v.upper() for v in kelompok.get("bc", []))
    mt_set = frozenset(v.upper() for v in kelompok.get("mt", []))
    tb_set = frozenset(v.upper() for v in kelompok.get("tb", []))
    tk_set = frozenset(v.upper() for v in kelompok.get("tk", []))

    loc = df_seamen["last_location"].fillna("").astype(str).str.strip()
    is_darat = loc.str.upper().isin(_LOKASI_OTHERS_UPPER)

    prev = (
        df_seamen["prevlocation"].fillna("").astype(str).str.strip()
        if "prevlocation" in df_seamen.columns
        else pd.Series("", index=df_seamen.index)
    )

    eff = loc.copy()
    eff.loc[is_darat] = prev.loc[is_darat]
    eff_upper = eff.str.upper()

    is_manalagi = eff_upper.isin(manalagi_set)
    is_container = eff_upper.isin(container_set)
    is_bc = eff_upper.isin(bc_set)
    is_mt = eff_upper.isin(mt_set)
    is_tb = eff_upper.isin(tb_set)
    is_tk = eff_upper.isin(tk_set)

    non_fleet = is_bc | is_mt | is_tb | is_tk

    if categorization == "container":
        mask = ~is_manalagi & ~non_fleet
    elif categorization == "manalagi":
        mask = ~is_container & ~non_fleet
    else:
        mask = pd.Series(True, index=df_seamen.index)

    return df_seamen[mask]


def _apply_forecast_filter(df_seamen: pd.DataFrame, forecast_month: int) -> pd.DataFrame:
    """
    Filter df_seamen by end_date range for forecast_month >= 2.
    Returns seamen whose end_date falls within [today, start of forecast month].
    """
    if forecast_month < 2:
        return df_seamen

    today = pd.Timestamp.now(tz="UTC").normalize()
    range_end = (today + pd.DateOffset(months=forecast_month)).replace(day=1)
    df = df_seamen.copy()
    df["end_date"] = pd.to_datetime(df["end_date"], errors="coerce", utc=True)
    return df[(df["end_date"] >= today) & (df["end_date"] <= range_end)]


def get_promotion_candidates_nakhoda(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get promotion candidates for NAKHODA position.
    Candidates are current MUALIM I with ANT-I certificate
    and at least 2 years of experience.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Filter by end_date range for forecast
    df_seamen = _apply_forecast_filter(df_seamen, forecast_month)

    # Filter by vessel categorization
    df_seamen = _apply_categorization_filter(df_seamen, categorization)

    # Tanggal cutoff pengalaman 2 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=2 * 365)

    # Filter seamen berdasarkan posisi dan sertifikat
    seamancode_terfilter = df_seamen[
        (df_seamen["last_position"] == "MUALIM I")
        & (df_seamen["certificate"] == "ANT-I")
    ]["seamancode"].unique()

    # Filter df_history untuk pengalaman lebih dari 2 tahun
    df_mutasi_filtered = df_history[
        (df_history["seamancode"].isin(seamancode_terfilter))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict dan hilangkan history yang tidak relevan
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "last_location": g["last_location"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "history": g[
                    ~g["fromvesselname"].isin(["PENDING GAJI", "PENDING CUTI"])
                ]["fromvesselname"]
                .dropna()
                .unique()
                .tolist(),
            }
        )
        .values.tolist()
    )

    return result


def get_promotion_candidates_kkm(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get promotion candidates for KKM position.
    Candidates are current MASINIS II with at least 4 years of experience
    and service on >= 2 required vessels.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Filter by end_date range for forecast
    df_seamen = _apply_forecast_filter(df_seamen, forecast_month)

    # Filter by vessel categorization
    df_seamen = _apply_categorization_filter(df_seamen, categorization)

    # Tanggal cutoff pengalaman 4 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=4 * 365)

    # Filter seamen berdasarkan posisi
    seamancode_terfilter = df_seamen[(df_seamen["last_position"] == "MASINIS II")][
        "seamancode"
    ].unique()

    # Filter df_history untuk pengalaman lebih dari 4 tahun
    df_mutasi_filtered = df_history[
        (df_history["seamancode"].isin(seamancode_terfilter))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]

    # Daftar kapal yang disyaratkan
    kapal_disyaratkan = {
        "KM. HIJAU SEJUK",
        "KM. ORIENTAL DIAMOND",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL JADE",
        "KM. VERIZON",
        "KM. SPIL HANA",
        "KM. SPIL HAPSRI",
        "KM. SPIL HAYU",
        "KM. SPIL HASYA",
        "KM. HIJAU JELITA",
        "KM. HIJAU SAMUDERA",
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL GALAXY",
        "KM. LUZON",
        "KM. ARMADA PERMATA",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL EMERALD",
    }

    # Hitung jumlah kapal unik dari daftar di atas yang pernah disinggahi oleh tiap seamancode
    df_kapal = df_mutasi_filtered.copy()
    df_kapal["kapal_terkait"] = df_kapal["fromvesselname"].where(
        df_kapal["fromvesselname"].isin(kapal_disyaratkan), None
    )
    df_kapal.loc[df_kapal["tovesselname"].isin(kapal_disyaratkan), "kapal_terkait"] = (
        df_kapal["tovesselname"]
    )

    # Ambil hanya yang punya >= 2 kapal unik dari daftar
    df_kapal_valid = (
        df_kapal.dropna(subset=["kapal_terkait"])
        .groupby("seamancode")["kapal_terkait"]
        .nunique()
        .reset_index()
    )
    df_kapal_valid = df_kapal_valid[df_kapal_valid["kapal_terkait"] >= 2]

    # Filter df_mutasi_filtered berdasarkan hasil di atas
    df_mutasi_filtered = df_mutasi_filtered[
        df_mutasi_filtered["seamancode"].isin(df_kapal_valid["seamancode"])
    ]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "last_location": g["last_location"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "history": g["fromvesselname"].dropna().unique().tolist(),
            }
        )
        .values.tolist()
    )

    return result


def get_promotion_candidates_mualimI(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get promotion candidates for MUALIM I position.
    Candidates are current MUALIM II with ANT-I certificate
    and at least 2 years of experience.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Filter by end_date range for forecast
    df_seamen = _apply_forecast_filter(df_seamen, forecast_month)

    # Filter by vessel categorization
    df_seamen = _apply_categorization_filter(df_seamen, categorization)

    # Tanggal cutoff pengalaman 2 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=2 * 365)

    # Filter seamen berdasarkan posisi dan sertifikat (sertifikat mualin 2 itu apa?)
    seamancode_terfilter = df_seamen[
        (df_seamen["last_position"] == "MUALIM II")
        & (df_seamen["certificate"] == "ANT-I")
    ]["seamancode"].unique()

    # Filter df_history untuk pengalaman lebih dari 2 tahun
    df_mutasi_filtered = df_history[
        (df_history["seamancode"].isin(seamancode_terfilter))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict dan hilangkan history yang tidak relevan
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "last_location": g["last_location"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "history": g[
                    ~g["fromvesselname"].isin(["PENDING GAJI", "PENDING CUTI"])
                ]["fromvesselname"]
                .dropna()
                .unique()
                .tolist(),
            }
        )
        .values.tolist()
    )

    return result


def get_promotion_candidates_masinisII(
    forecast_month: int = 1, categorization: str | None = None
) -> list:
    """
    Get promotion candidates for MASINIS II position.
    Candidates are current MASINIS III with at least 4 years of experience
    and service on >= 2 required vessels.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Filter by end_date range for forecast
    df_seamen = _apply_forecast_filter(df_seamen, forecast_month)

    # Filter by vessel categorization
    df_seamen = _apply_categorization_filter(df_seamen, categorization)

    # Tanggal cutoff pengalaman 4 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=4 * 365)

    # Filter seamen berdasarkan posisi
    seamancode_terfilter = df_seamen[(df_seamen["last_position"] == "MASINIS III")][
        "seamancode"
    ].unique()

    # Filter df_history untuk pengalaman lebih dari 4 tahun
    df_mutasi_filtered = df_history[
        (df_history["seamancode"].isin(seamancode_terfilter))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]

    # Daftar kapal yang disyaratkan
    kapal_disyaratkan = {
        "KM. HIJAU SEJUK",
        "KM. ORIENTAL DIAMOND",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL JADE",
        "KM. VERIZON",
        "KM. SPIL HANA",
        "KM. SPIL HAPSRI",
        "KM. SPIL HAYU",
        "KM. SPIL HASYA",
        "KM. HIJAU JELITA",
        "KM. HIJAU SAMUDERA",
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL GALAXY",
        "KM. LUZON",
        "KM. ARMADA PERMATA",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL EMERALD",
    }

    # Hitung jumlah kapal unik dari daftar di atas yang pernah disinggahi oleh tiap seamancode
    df_kapal = df_mutasi_filtered.copy()
    df_kapal["kapal_terkait"] = df_kapal["fromvesselname"].where(
        df_kapal["fromvesselname"].isin(kapal_disyaratkan), None
    )
    df_kapal.loc[df_kapal["tovesselname"].isin(kapal_disyaratkan), "kapal_terkait"] = (
        df_kapal["tovesselname"]
    )

    # Ambil hanya yang punya >= 2 kapal unik dari daftar
    df_kapal_valid = (
        df_kapal.dropna(subset=["kapal_terkait"])
        .groupby("seamancode")["kapal_terkait"]
        .nunique()
        .reset_index()
    )
    df_kapal_valid = df_kapal_valid[df_kapal_valid["kapal_terkait"] >= 2]

    # Filter df_mutasi_filtered berdasarkan hasil di atas
    df_mutasi_filtered = df_mutasi_filtered[
        df_mutasi_filtered["seamancode"].isin(df_kapal_valid["seamancode"])
    ]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "last_location": g["last_location"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "history": g["fromvesselname"].dropna().unique().tolist(),
            }
        )
        .values.tolist()
    )

    return result


# ISSUE


def get_promotion_candidates_mualimII(forecast_month: int = 1) -> list:
    """
    Get promotion candidates for MUALIM II position.
    Candidates are current MUALIM III with ANT-I certificate and 2+ years experience,
    or any MUALIM III (is_talent included).

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Tanggal cutoff pengalaman 2 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=2 * 365)

    # Filter seamen berdasarkan posisi dan sertifikat
    seamancode_terfilter = df_seamen[
        (df_seamen["last_position"] == "MUALIM III")
        & (df_seamen["certificate"] == "ANT-I")
    ]["seamancode"].unique()

    # Cari seamancode yang punya pengalaman >= 2 tahun
    seamancode_with_experience = df_history[
        (df_history["seamancode"].isin(seamancode_terfilter))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]["seamancode"].unique()

    # Tambahkan seamen dengan is_talent di posisi MUALIM III
    seamancode_talent = df_seamen[(df_seamen["last_position"] == "MUALIM III")][
        "seamancode"
    ].unique()

    # Gabungkan kedua kriteria (experience + talent)
    seamancode_qualified = list(
        set(seamancode_with_experience) | set(seamancode_talent)
    )

    # Ambil SEMUA history untuk seamancode yang qualified
    df_mutasi_filtered = df_history[df_history["seamancode"].isin(seamancode_qualified)]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "is_talent", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict dan hilangkan history yang tidak relevan
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "vessel": g["last_location"].iloc[0],
                "is_talent": (
                    bool(g["is_talent"].iloc[0])
                    if pd.notna(g["is_talent"].iloc[0])
                    else False
                ),
                "history": g[
                    ~g["fromvesselname"].isin(["PENDING GAJI", "PENDING CUTI"])
                ]["fromvesselname"]
                .dropna()
                .unique()
                .tolist(),
            }
        )
        .values.tolist()
    )

    return result


def get_promotion_candidates_masinisIII(forecast_month: int = 1) -> list:
    """
    Get promotion candidates for MASINIS III position.
    Candidates are current MASINIS IV who are is_talent,
    or have 4+ years experience and service on >= 2 required vessels.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Tanggal cutoff pengalaman 4 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=4 * 365)

    # Filter seamen berdasarkan posisi
    seamancode_terfilter = df_seamen[(df_seamen["last_position"] == "MASINIS IV")][
        "seamancode"
    ].unique()

    # Daftar kapal yang disyaratkan
    kapal_disyaratkan = {
        "KM. HIJAU SEJUK",
        "KM. ORIENTAL DIAMOND",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL JADE",
        "KM. VERIZON",
        "KM. SPIL HANA",
        "KM. SPIL HAPSRI",
        "KM. SPIL HAYU",
        "KM. SPIL HASYA",
        "KM. HIJAU JELITA",
        "KM. HIJAU SAMUDERA",
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL GALAXY",
        "KM. LUZON",
        "KM. ARMADA PERMATA",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL EMERALD",
    }

    # Ambil SEMUA history untuk seamancode terfilter (untuk cek kapal requirement)
    df_all_history = df_history[df_history["seamancode"].isin(seamancode_terfilter)]

    # Hitung jumlah kapal unik dari daftar di atas yang pernah disinggahi oleh tiap seamancode
    df_kapal = df_all_history.copy()
    df_kapal["kapal_terkait"] = df_kapal["fromvesselname"].where(
        df_kapal["fromvesselname"].isin(kapal_disyaratkan), None
    )
    df_kapal.loc[df_kapal["tovesselname"].isin(kapal_disyaratkan), "kapal_terkait"] = (
        df_kapal["tovesselname"]
    )

    # Ambil hanya yang punya >= 2 kapal unik dari daftar
    df_kapal_valid = (
        df_kapal.dropna(subset=["kapal_terkait"])
        .groupby("seamancode")["kapal_terkait"]
        .nunique()
        .reset_index()
    )
    df_kapal_valid = df_kapal_valid[df_kapal_valid["kapal_terkait"] >= 2]

    # Cari seamancode yang punya pengalaman >= 4 tahun DAN memenuhi kapal requirement
    seamancode_with_experience = df_history[
        (df_history["seamancode"].isin(df_kapal_valid["seamancode"]))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]["seamancode"].unique()

    # Tambahkan seamen dengan is_talent di posisi MASINIS IV
    seamancode_talent = df_seamen[
        (df_seamen["last_position"] == "MASINIS IV") & (df_seamen["is_talent"])
    ]["seamancode"].unique()

    # Gabungkan kedua kriteria (experience + talent)
    seamancode_qualified = list(
        set(seamancode_with_experience) | set(seamancode_talent)
    )

    # Ambil SEMUA history untuk seamancode yang qualified
    df_mutasi_filtered = df_history[df_history["seamancode"].isin(seamancode_qualified)]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "is_talent", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "vessel": g["last_location"].iloc[0],
                "is_talent": (
                    bool(g["is_talent"].iloc[0])
                    if pd.notna(g["is_talent"].iloc[0])
                    else False
                ),
                "history": g["fromvesselname"].dropna().unique().tolist(),
            }
        )
        .values.tolist()
    )

    return result


def get_promotion_candidates_mualimIII(forecast_month: int = 1) -> list:
    """
    Get promotion candidates for MUALIM III position.
    Candidates are current JURU MUDI with ANT-III certificate and 2+ years experience,
    or any JURU MUDI with is_talent flag.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Tanggal cutoff pengalaman 2 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=2 * 365)

    # Filter seamen berdasarkan posisi dan sertifikat
    seamancode_terfilter = df_seamen[
        (df_seamen["last_position"] == "JURU MUDI")
        & (df_seamen["certificate"] == "ANT-III")
    ]["seamancode"].unique()

    # Cari seamancode yang punya pengalaman >= 2 tahun
    seamancode_with_experience = df_history[
        (df_history["seamancode"].isin(seamancode_terfilter))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]["seamancode"].unique()

    # Tambahkan seamen dengan is_talent di posisi JURU MUDI
    seamancode_talent = df_seamen[
        (df_seamen["last_position"] == "JURU MUDI") & (df_seamen["is_talent"])
    ]["seamancode"].unique()

    # Gabungkan kedua kriteria (experience + talent)
    seamancode_qualified = list(
        set(seamancode_with_experience) | set(seamancode_talent)
    )

    # Ambil SEMUA history untuk seamancode yang qualified
    df_mutasi_filtered = df_history[df_history["seamancode"].isin(seamancode_qualified)]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "is_talent", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict dan hilangkan history yang tidak relevan
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "vessel": g["last_location"].iloc[0],
                "is_talent": (
                    bool(g["is_talent"].iloc[0])
                    if pd.notna(g["is_talent"].iloc[0])
                    else False
                ),
                "history": g[
                    ~g["fromvesselname"].isin(["PENDING GAJI", "PENDING CUTI"])
                ]["fromvesselname"]
                .dropna()
                .unique()
                .tolist(),
            }
        )
        .values.tolist()
    )

    return result


def get_promotion_candidates_masinisIV(forecast_month: int = 1) -> list:
    """
    Get promotion candidates for MASINIS IV position.
    Candidates are current JURU MINYAK who are is_talent,
    or have 4+ years experience and service on >= 2 required vessels.

    Returns:
        list: List of promotion candidate records
    """
    # Load from Supabase instead of Excel
    df_history = get_mutations_data()
    df_seamen = get_seamen_data()

    # Tanggal cutoff pengalaman 4 tahun
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=4 * 365)

    # Filter seamen berdasarkan posisi
    seamancode_terfilter = df_seamen[(df_seamen["last_position"] == "JURU MINYAK")][
        "seamancode"
    ].unique()

    # Daftar kapal yang disyaratkan
    kapal_disyaratkan = {
        "KM. HIJAU SEJUK",
        "KM. ORIENTAL DIAMOND",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL JADE",
        "KM. VERIZON",
        "KM. SPIL HANA",
        "KM. SPIL HAPSRI",
        "KM. SPIL HAYU",
        "KM. SPIL HASYA",
        "KM. HIJAU JELITA",
        "KM. HIJAU SAMUDERA",
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL GALAXY",
        "KM. LUZON",
        "KM. ARMADA PERMATA",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL EMERALD",
    }

    # Ambil SEMUA history untuk seamancode terfilter (untuk cek kapal requirement)
    df_all_history = df_history[df_history["seamancode"].isin(seamancode_terfilter)]

    # Hitung jumlah kapal unik dari daftar di atas yang pernah disinggahi oleh tiap seamancode
    df_kapal = df_all_history.copy()
    df_kapal["kapal_terkait"] = df_kapal["fromvesselname"].where(
        df_kapal["fromvesselname"].isin(kapal_disyaratkan), None
    )
    df_kapal.loc[df_kapal["tovesselname"].isin(kapal_disyaratkan), "kapal_terkait"] = (
        df_kapal["tovesselname"]
    )

    # Ambil hanya yang punya >= 2 kapal unik dari daftar
    df_kapal_valid = (
        df_kapal.dropna(subset=["kapal_terkait"])
        .groupby("seamancode")["kapal_terkait"]
        .nunique()
        .reset_index()
    )
    df_kapal_valid = df_kapal_valid[df_kapal_valid["kapal_terkait"] >= 2]

    # Cari seamancode yang punya pengalaman >= 4 tahun DAN memenuhi kapal requirement
    seamancode_with_experience = df_history[
        (df_history["seamancode"].isin(df_kapal_valid["seamancode"]))
        & (pd.to_datetime(df_history["transactiondate"]) <= cutoff_date)
    ]["seamancode"].unique()

    # Tambahkan seamen dengan is_talent di posisi JURU MINYAK
    seamancode_talent = df_seamen[
        (df_seamen["last_position"] == "JURU MINYAK") & (df_seamen["is_talent"])
    ]["seamancode"].unique()

    # Gabungkan kedua kriteria (experience + talent)
    seamancode_qualified = list(
        set(seamancode_with_experience) | set(seamancode_talent)
    )

    # Ambil SEMUA history untuk seamancode yang qualified
    df_mutasi_filtered = df_history[df_history["seamancode"].isin(seamancode_qualified)]

    # Merge untuk ambil nama
    df_mutasi_filtered = df_mutasi_filtered.merge(
        df_seamen[
            ["seamancode", "name", "last_position", "is_talent", "last_location"]
        ].drop_duplicates(),
        on="seamancode",
        how="left",
    )

    # Group jadi dict
    result = (
        df_mutasi_filtered.groupby("seamancode")
        .apply(
            lambda g: {
                "code": int(g["seamancode"].iloc[0]),
                "name": g["name"].iloc[0],
                "rank": g["last_position"].iloc[0],
                "vessel": g["last_location"].iloc[0],
                "is_talent": (
                    bool(g["is_talent"].iloc[0])
                    if pd.notna(g["is_talent"].iloc[0])
                    else False
                ),
                "history": g["fromvesselname"].dropna().unique().tolist(),
            }
        )
        .values.tolist()
    )

    return result
