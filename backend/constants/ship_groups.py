"""
Constants Configuration
Contains ship groups and other constant values used throughout the application.
"""

# Ship Groups for Rotation Management
# Organized by vessel type (Manalagi, Container) and rotation/KKM groups
SHIP_GROUPS = {
    # ============================================================================
    # MANALAGI ROTATION GROUPS
    # ============================================================================
    "manalagi_rotation": [
        "KM. MANALAGI PRITA",
        "KM. MANALAGI ASTA",
        "KM. MANALAGI ASTI",
        "KM. MANALAGI DASA",
        "KM. MANALAGI ENZI",
        "KM. MANALAGI TARA",
        "KM. MANALAGI WANDA",
    ],
    "manalagi_rotation2": [
        "KM. MANALAGI TISYA",
        "KM. MANALAGI SAMBA",
        "KM. MANALAGI HITA",
        "KM. MANALAGI VIRA",
        "KM. MANALAGI YASA",
        "KM. XYS SATU",
    ],
    # ============================================================================
    # MANALAGI KKM GROUPS
    # ============================================================================
    "manalagi_kkm": [
        "KM. MANALAGI ASTA",
        "KM. MANALAGI ASTI",
        "KM. MANALAGI SAMBA",
        "KM. MANALAGI YASA",
        "KM. XYS SATU",
        "KM. MANALAGI WANDA",
    ],
    "manalagi_kkm2": [
        "KM. MANALAGI TISYA",
        "KM. MANALAGI PRITA",
        "KM. MANALAGI DASA",
        "KM. MANALAGI HITA",
        "KM. MANALAGI ENZI",
        "KM. MANALAGI TARA",
        "KM. MANALAGI VIRA",
    ],
    # ============================================================================
    # CONTAINER ROTATION GROUPS
    # ============================================================================
    "container_rotation1": [
        "KM. ORIENTAL EMERALD",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL JADE",
        "KM. ORIENTAL DIAMOND",
    ],
    "container_rotation2": [
        "KM. LUZON",
        "KM. VERIZON",
        "KM. ORIENTAL GALAXY",
        "KM. HIJAU SAMUDRA",
        "KM. ARMADA PERMATA",
    ],
    "container_rotation3": [
        "KM. ORIENTAL SAMUDERA",
        "KM. ORIENTAL PACIFIC",
        "KM. PULAU NUNUKAN",
        "KM. TELUK FLAMINGGO",
        "KM. TELUK BERAU",
        "KM. TELUK BINTUNI",
    ],
    "container_rotation4": [
        "KM. PULAU LAYANG",
        "KM. PULAU WETAR",
        "KM. PULAU HOKI",
        "KM. SPIL HANA",
        "KM. SPIL HASYA",
        "KM. SPIL HAPSRI",
        "KM. SPIL HAYU",
    ],
    "container_rotation5": [
        "KM. HIJAU JELITA",
        "KM. HIJAU SEJUK",
        "KM. ARMADA SEJATI",
        "KM. ARMADA SERASI",
        "KM. ARMADA SEGARA",
        "KM. ARMADA SENADA",
        "KM. HIJAU SEGAR",
        "KM. TITANIUM",
        "KM. VERTIKAL",
    ],
    "container_rotation6": [
        "KM. SPIL RENATA",
        "KM. SPIL RATNA",
        "KM. SPIL RUMI",
        "KM. PEKAN BERAU",
        "KM SPIL RAHAYU",
        "KM. SPIL RETNO",
        "KM. MINAS BARU",
        "KM PEKAN SAMPIT",
        "KM. SELILI BARU",
    ],
    "container_rotation7": [
        "KM. DERAJAT",
        "KM. MULIANIM",
        "KM. PRATIWI RAYA",
        "KM. MAGELLAN",
        "KM. PAHALA",
        "KM. PEKAN RIAU",
        "KM. PEKAN FAJAR",
        "KM. FORTUNE",
    ],
    "container_rotation8": [
        "KM. PRATIWI SATU",
        "KM. BALI SANUR",
        "KM. BALI KUTA",
        "KM. BALI GIANYAR",
        "KM. BALI AYU",
        "KM. AKASHIA",
        "KM KAPPA",
    ],
    # ============================================================================
    # CONTAINER KKM GROUPS
    # ============================================================================
    "container_kkm1": [
        "KM. ORIENTAL GOLD",
        "KM. ORIENTAL EMERALD",
        "KM. ORIENTAL GALAXY",
        "KM. ORIENTAL RUBY",
        "KM. ORIENTAL SILVER",
        "KM. ORIENTAL JADE",
        "KM. VERIZON",
        "KM. LUZON",
        "KM. ORIENTAL DIAMOND",
    ],
    "container_kkm2": [
        "KM. SPIL HAPSRI",
        "KM. ARMADA PERMATA",
        "KM. HIJAU SAMUDRA",
        "KM. SPIL HASYA",
        "KM. ARMADA SEJATI",
        "KM. SPIL HAYU",
        "KM. SPIL HANA",
        "KM. HIJAU SEJUK",
        "KM. HIJAU JELITA",
    ],
    "container_kkm3": [
        "KM. ORIENTAL PACIFIC",
        "KM. ORIENTAL SAMUDERA",
        "KM. ARMADA SEGARA",
        "KM. ARMADA SENADA",
        "KM. ARMADA SERASI",
        "KM. SPIL RATNA",
        "KM. SPIL RUMI",
        "KM. PULAU NUNUKAN",
    ],
    "container_kkm4": [
        "KM. PULAU HOKI",
        "KM. TELUK BINTUNI",
        "KM. TELUK FLAMINGGO",
        "KM. PULAU LAYANG",
        "KM. TELUK BERAU",
        "KM. SPIL RENATA",
        "KM. PULAU WETAR",
        "KM SPIL RAHAYU",
        "KM. SPIL RETNO",
    ],
    "container_kkm5": [
        "KM. MINAS BARU",
        "KM. SELILI BARU",
        "KM. VERTIKAL",
        "KM. HIJAU SEGAR",
        "KM. PEKAN RIAU",
        "KM. PEKAN BERAU",
        "KM. PEKAN FAJAR",
        "KM. PEKAN SAMPIT",
        "KM. TITANIUM",
    ],
    "container_kkm6": [
        "KM. PRATIWI RAYA",
        "KM. PRATIWI SATU",
        "KM. BALI AYU",
        "KM. BALI GIANYAR",
        "KM. BALI SANUR",
        "KM. BALI KUTA",
    ],
    "container_kkm7": [
        "KM. MAGELLAN",
        "KM. MULIANIM",
        "KM. PAHALA",
        "KM. FORTUNE",
        "KM. AKASHIA",
        "KM. DERAJAT",
    ],
}
