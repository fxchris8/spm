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


def generate_crew_backup_pairs(ship_names, first_assignments):
    crew = [f"C{i+1}" for i in range(len(ship_names) + 1)]
    backup_pairs = []

    # Determine backup pairs based on first assignment and transaction logic
    for i in range(len(ship_names) + 1):
        main_crew = crew[i]  # Crew utama sesuai urutan
        backup_crew = crew[(i - 1) % len(crew)]  # Backup mengikuti aturan rotasi mundur

        # Mengatasi kasus rotasi C1 digantikan oleh C7
        if i == 0:
            backup_crew = crew[-1]  # C1 digantikan oleh C7

        backup_pairs.append({"main": main_crew, "backup": backup_crew})

    return backup_pairs


def color_map(val):
    """Mengembalikan style CSS berdasarkan nilai sel."""
    color_dict = {
        "A": "blue",
        "B": "red",
        "C": "green",
        "D": "orange",
        "E": "purple",
        "F": "brown",
        "G": "yellow",
        "H": "pink",
        "I": "cyan",
        "J": "magenta",
        "K": "lime",
        "L": "teal",
        "M": "indigo",
        "N": "gold",
        "O": "silver",
    }

    if val in color_dict:
        return f"background-color: {color_dict[val]}; color: white;"
    else:
        return ""
