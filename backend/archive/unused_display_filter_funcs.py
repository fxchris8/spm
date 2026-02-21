# Fungsi-fungsi ini dipindahkan dari app.py karena tidak digunakan di manapun.
# Dipindahkan pada: 2026-02-21

# kode 1
def prepare_display_df(df):
    display_df = df[
        ["SEAMAN CODE", "SEAMAN NAME", "VESSEL GROUP ID", "RANK", "CERTIFICATE"]
    ].copy()
    display_df.rename(columns={"UMUR": "AGE"}, inplace=True)
    return display_df


def prioritize_nakhoda_ant1(df):
    certificate_priority = {
        "ANT-I": 5,
        "ANT-II": 4,
        "ANT-III": 3,
        "ANT-IV": 2,
        "ANT-D": 1,
    }

    df["priority"] = df["CERTIFICATE"].map(certificate_priority).fillna(0)

    sorted_df = df.sort_values(by="priority", ascending=False).drop(
        columns=["priority"]
    )
    return sorted_df


def filter_group_1(df, group_id):
    filtered_df = df[df["VESSEL GROUP ID"] == group_id].copy()
    return filtered_df


# kode 2
def prepare_display_df2(df):
    display_df2 = df[
        ["SEAMAN CODE", "SEAMAN NAME", "VESSEL GROUP ID", "RANK", "CERTIFICATE"]
    ].copy()
    display_df2.rename(columns={"UMUR": "AGE"}, inplace=True)
    return display_df2


def prioritize_nakhoda_ant2(df):
    certificate_priority = {
        "ATT-I": 6,
        "ATT-II": 5,
        "ATT-III": 4,
        "ATT-IV": 3,
        "ATT-V": 2,
        "ATT-D": 1,
    }

    df["priority"] = df["CERTIFICATE"].map(certificate_priority).fillna(0)

    sorted_df2 = df.sort_values(by="priority", ascending=False).drop(
        columns=["priority"]
    )
    return sorted_df2


def filter_group_2(df, group_id):
    filtered_df2 = df[df["VESSEL GROUP ID"] == group_id].copy()
    return filtered_df2
