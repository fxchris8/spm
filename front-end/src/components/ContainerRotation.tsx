"use client";

import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { CardComponent } from "./CardComponent";
import { InputComponent } from "./InputComponent";
import { TableComponent } from "./TableComponent";
import { HiUserGroup, HiStar } from "react-icons/hi";
import * as XLSX from "xlsx";
import { Spinner } from "flowbite-react";

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface ApiResponse {
  schedule?: TableJson;
  nahkoda?: TableJson;
  darat?: TableJson | null;
  error?: string;
}

interface ContainerProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

// interface PotentialPromotionItem {
//   seamancode: string;
//   name: string;
//   history: string;
//   matchCount: number;
// }

export function ContainerRotation({
  groups,
  vessel,
  type,
  part,
  job,
}: ContainerProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [cadanganData, setCadanganData] = useState<any[]>([]);
  const [promotionCandidatesData, setPromotionCandidatesData] = useState<any[]>(
    []
  );
  const [selectedStandby, setSelectedStandby] = useState<string[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);
  const [scheduleTable, setScheduleTable] = useState<TableJson | null>(null);
  const [nahkodaTable, setNahkodaTable] = useState<TableJson | null>(null);
  const [daratTable, setDaratTable] = useState<TableJson | null>(null);
  const [potentialTable, setPotentialTable] = useState<TableJson | null>(null);
  const [mutasiTable, setMutasiTable] = useState<TableJson | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingGroup, setLoadingGroup] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch cadangan
  useEffect(() => {
    fetch(`${API_BASE_URL}/get_cadangan_${job}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setCadanganData(data))
      .catch((err) => {
        console.error(`Error fetching cadangan ${job}:`, err);
        setError(`Gagal memuat data ${job}`);
      });
  }, [job]);

  // Fetch promotion candidates (merged dari PromotionNahkoda)
  useEffect(() => {
    const fetchPromotionCandidates = async () => {
      try {
        const endpoint =
          job?.toUpperCase?.() === "KKM"
            ? `${API_BASE_URL}/seamen/promotion_candidates_kkm`
            : `${API_BASE_URL}/seamen/promotion_candidates`;

        const res = await fetch(endpoint);
        const json = await res.json();

        if (json.status === "success") {
          const formatted = json.data.map((item: any) => ({
            seamancode: String(
              item.code ||
                item.seamancode ||
                item.seaman_code ||
                item.seamanCode ||
                ""
            ),
            name: item.name,
            rank: item.rank,
            history: Array.isArray(item.history)
              ? item.history
                  .filter(
                    (h: string) =>
                      h !== "PENDING GAJI" &&
                      h !== "PENDING CUTI" &&
                      h !== "DARAT STAND-BY" &&
                      h !== "DARAT BIASA"
                  )
                  .join(", ")
              : item.history || "",
          }));
          setPromotionCandidatesData(formatted);
        }
      } catch (err) {
        console.error("Error fetching promotion candidates:", err);
      }
    };

    fetchPromotionCandidates();
  }, [job]);

  // Fetch mutasi
  useEffect(() => {
    if (!job || !selectedGroup) {
      setMutasiTable(null);
      setLoadingGroup(false);
      return;
    }

    const formattedJob = job.toUpperCase();

    fetch(`${API_BASE_URL}/mutasi_filtered?job=${formattedJob}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const rawData = data.data;
          const groupShips = groups[selectedGroup] || [];

          const rows = Object.entries(rawData)
            .map(([seamancode, item]: [string, any]) => {
              const vesselList = item.vessels;
              const matchCount = vesselList.filter((v: string) =>
                groupShips.includes(v)
              ).length;
              return {
                seamancode,
                name: item.name,
                vessels: vesselList.join(", "),
                matchCount,
              };
            })
            .filter((item) => item.matchCount >= 0)
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 10);

          setMutasiTable({
            columns: ["seamancode", "name", "vessels", "matchCount"],
            data: rows,
          });
        } else {
          setMutasiTable(null);
        }
      })
      .catch((err) => {
        console.error("Gagal load mutasi data:", err);
        setMutasiTable(null);
      })
      .finally(() => {
        setLoadingGroup(false);
      });
  }, [selectedGroup, job]);

  // Fetch Potential Promosi
  useEffect(() => {
    if (!selectedGroup) {
      setPotentialTable(null);
      return;
    }

    const controller = new AbortController();

    const groupShips = groups[selectedGroup] || [];
    const queryParams = groupShips
      .map((g) => `group=${encodeURIComponent(g)}`)
      .join("&");

    const historyUrl = `${API_BASE_URL}/filter_history?${queryParams}`;

    const candidateUrl =
      job?.toUpperCase?.() === "KKM"
        ? `${API_BASE_URL}/seamen/promotion_candidates_kkm`
        : `${API_BASE_URL}/seamen/promotion_candidates`;

    const getCode = (x: any) =>
      String(
        x?.seamancode ?? x?.code ?? x?.seaman_code ?? x?.seamanCode ?? ""
      ).trim();

    Promise.all([
      fetch(historyUrl, { signal: controller.signal }).then((r) => r.json()),
      fetch(candidateUrl, { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([hist, cand]) => {
        if (controller.signal.aborted) return;

        const histRowsRaw = Array.isArray(hist?.data) ? hist.data : [];
        const candRowsRaw = Array.isArray(cand?.data) ? cand.data : [];

        const allowed = new Set(candRowsRaw.map(getCode));

        let rows = histRowsRaw
          .map((item: any) => ({
            seamancode: getCode(item),
            name: item?.name,
            history: item?.history,
            matchCount: item?.matchCount ?? 0,
          }))
          .filter((r: any) => r.seamancode && allowed.has(r.seamancode))
          .sort((a: any, b: any) => (b.matchCount ?? 0) - (a.matchCount ?? 0))
          .slice(0, 10);

        if (!rows.length) {
          setPotentialTable(null);
          return;
        }
        setPotentialTable({
          columns: ["seamancode", "name", "history", "matchCount"],
          data: rows,
        });
      })

      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Gagal load potential:", err);
        setPotentialTable(null);
      });

    return () => controller.abort();
  }, [selectedGroup, job]);

  // Auto-pilih DARAT STAND-BY
  useEffect(() => {
    if (cadanganData.length > 0) {
      const standByCodes = cadanganData
        .filter((item) => item.last_location === "DARAT STAND-BY")
        .map((item) => item.seamancode);
      setSelectedStandby(standByCodes);
    }
  }, [cadanganData]);

  const handleCardClick = async (groupKey: string) => {
    setSelectedGroup(groupKey);
    setLoadingGroup(true);
  };

  const handleGenerateSchedule = async () => {
    setError("");
    if (!selectedGroup) {
      setError("Silakan pilih grup terlebih dahulu!");
      return;
    }
    if (selectedStandby.length === 0) {
      setError("Minimal 1 Nahkoda 'Darat Stand-By' harus dipilih!");
      return;
    }

    try {
      const mappedGroup = selectedGroup.replace("container_rotation", vessel);
      const payload = {
        selected_group: mappedGroup,
        cadangan: selectedStandby,
        cadangan2: selectedOptional,
        type: type,
        part: part,
      };

      const response = await fetch(`${API_BASE_URL}/container_rotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal generate schedule");
      }

      const data: ApiResponse = await response.json();

      const rawScheduleTable = data.schedule || null;
      if (rawScheduleTable) {
        console.log("Schedule Columns:", rawScheduleTable.columns);
      }

      let cleanedScheduleTable = rawScheduleTable;
      if (cleanedScheduleTable?.columns?.includes("First Rotation Date")) {
        cleanedScheduleTable = {
          ...cleanedScheduleTable,
          columns: cleanedScheduleTable.columns.filter(
            (c: string) => c !== "First Rotation Date"
          ),
          data: cleanedScheduleTable.data.map(
            ({ ["First Rotation Date"]: _drop, ...rest }: any) => rest
          ),
        };
      }

      let updatedNahkodaTable = data.nahkoda || null;

      if (updatedNahkodaTable && rawScheduleTable) {
        const monthToNum: Record<string, string> = {
          JANUARY: "01",
          JAN: "01",
          JANUARI: "01",
          FEBRUARY: "02",
          FEB: "02",
          FEBRUARI: "02",
          MARCH: "03",
          MAR: "03",
          MARET: "03",
          APRIL: "04",
          APR: "04",
          MAY: "05",
          MEI: "05",
          JUNE: "06",
          JUN: "06",
          JUNI: "06",
          JULY: "07",
          JUL: "07",
          JULI: "07",
          AUGUST: "08",
          AUG: "08",
          AGUSTUS: "08",
          SEPTEMBER: "09",
          SEP: "09",
          SEPT: "09",
          OCTOBER: "10",
          OCT: "10",
          OKTOBER: "10",
          NOVEMBER: "11",
          NOV: "11",
          DECEMBER: "12",
          DEC: "12",
          DESEMBER: "12",
        };

        const normalize = (s: any) =>
          String(s ?? "")
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const monthColsInfo = (rawScheduleTable.columns || [])
          .map((col: string) => {
            const hdr = normalize(col);
            const m = hdr.match(/^([A-Za-zÀ-ÿ\.]+)\s+(\d{4})$/);
            if (!m) return null;
            let mon = m[1].toUpperCase().replace(/\.$/, "");
            if (!monthToNum[mon]) {
              let abbr = mon.slice(0, 3);
              if (abbr === "SEP" || abbr === "SEPT") abbr = "SEP";
              mon = monthToNum[abbr] ? abbr : mon;
            }
            const mm = monthToNum[mon];
            if (!mm) return null;
            return { col, mm, year: m[2] };
          })
          .filter(Boolean) as { col: string; mm: string; year: string }[];

        const firstSeen: Record<
          string,
          { mm: string; year: string; idx: number }
        > = {};
        const toIndex = (mm: string, year: string) =>
          parseInt(year, 10) * 12 + (parseInt(mm, 10) - 1);

        for (const { col, mm, year } of monthColsInfo) {
          const t = toIndex(mm, year);
          for (const row of rawScheduleTable.data || []) {
            const cell = normalize((row as any)[col]);
            if (!cell) continue;
            const letter = cell.toUpperCase();

            const cur = firstSeen[letter];
            if (!cur || t < cur.idx) {
              firstSeen[letter] = { mm, year, idx: t };
            }
          }
        }

        if (!updatedNahkodaTable.columns.includes("first_rotation_date")) {
          updatedNahkodaTable = {
            ...updatedNahkodaTable,
            columns: [...updatedNahkodaTable.columns, "first_rotation_date"],
          };
        }

        updatedNahkodaTable = {
          ...updatedNahkodaTable,
          data: updatedNahkodaTable.data.map((r: any) => {
            const idx = normalize(r.index ?? r.INDEX ?? r.Index).toUpperCase();
            const seen = firstSeen[idx];
            const firstDate = seen ? `${seen.mm}-${seen.year}` : "-";
            return { ...r, first_rotation_date: firstDate };
          }),
        };
      }

      setScheduleTable(cleanedScheduleTable);
      setNahkodaTable(updatedNahkodaTable);
      setDaratTable(data.darat || null);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Terjadi kesalahan saat memproses");
    }
  };

  // const cadanganMap = Object.fromEntries(
  //   cadanganData.map((item) => [String(item.seamancode), item.name])
  // );

  const mutasiItems =
    mutasiTable?.data.map((item) => {
      const seamancodeStr = String(item.seamancode).trim();
      const found = cadanganData.find(
        (c) => String(c.seamancode).trim() === seamancodeStr
      );
      const name = found?.name || item.name || "Unknown";
      return {
        seamancode: seamancodeStr,
        name,
        last_location: "",
      };
    }) || [];

  const potentialItems =
    potentialTable?.data.map((item) => {
      const seamancodeStr = String(item.seamancode).trim();
      return {
        seamancode: seamancodeStr,
        name: item.name,
        last_location: "",
      };
    }) || [];

  // Tambahkan promotion candidates ke daftar (merged dari PromotionNahkoda)
  const promotionItems = promotionCandidatesData.map((item) => ({
    seamancode: String(item.seamancode).trim(),
    name: item.name,
    last_location: "",
  }));

  const allCadanganItems = [
    ...mutasiItems,
    ...potentialItems.filter(
      (p) => !mutasiItems.some((m) => m.seamancode === p.seamancode)
    ),
    ...promotionItems.filter(
      (pr) =>
        !mutasiItems.some((m) => m.seamancode === pr.seamancode) &&
        !potentialItems.some((p) => p.seamancode === pr.seamancode)
    ),
  ];

  const standByData = allCadanganItems;
  const optionalData = allCadanganItems.filter(
    (item) => !selectedStandby.includes(item.seamancode)
  );

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    if (nahkodaTable) {
      const wsNahkoda = XLSX.utils.json_to_sheet(nahkodaTable.data);
      XLSX.utils.book_append_sheet(wb, wsNahkoda, "Nahkoda");
    }

    if (scheduleTable) {
      const wsSchedule = XLSX.utils.json_to_sheet(scheduleTable.data, {
        header: scheduleTable.columns,
      });
      XLSX.utils.book_append_sheet(wb, wsSchedule, "RotationPlan");
    }

    if (daratTable) {
      const wsDarat = XLSX.utils.json_to_sheet(daratTable.data);
      XLSX.utils.book_append_sheet(wb, wsDarat, "Reliever");
    }

    XLSX.writeFile(wb, "Crew_Schedule.xlsx");
  };

  const getJobDisplayName = (job: string): string => {
    switch (job) {
      case "nakhoda":
        return "NAHKODA";
      case "KKM":
        return "KKM";
      case "mualimI":
        return "MUALIM I";
      case "masinisII":
        return "MASINIS II";
      default:
        return job.toUpperCase();
    }
  };

  return (
    <>
      <div className="text-3xl mb-3 font-bold">Generate Ship Crew Schedule</div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => (
          <CardComponent
            key={groupKey}
            groupName={`Group ${groupKey.replace("container_rotation", "")}`}
            listShip={ships.join(", ")}
            isActive={selectedGroup === groupKey}
            onClick={() => handleCardClick(groupKey)}
          />
        ))}
      </div>

      {loadingGroup ? (
        <div className="flex justify-center items-center mt-6">
          <Spinner color="info" size="xl" />
          <span className="ml-2 text-gray-700">Loading data...</span>
        </div>
      ) : (
        (mutasiTable || potentialTable) && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mutasiTable && (
              <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <HiUserGroup className="h-5 w-5 text-red-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {getJobDisplayName(job)} EXISTING
                  </h2>
                </div>
                <TableComponent table={mutasiTable} />
              </div>
            )}

            {/* Conditional rendering: Potential Promotion hanya untuk Nakhoda di group 7 & 8 */}
            {potentialTable && (
              <>
                {job === "nakhoda" ? (
                  // Hanya tampilkan untuk group 7 & 8
                  (selectedGroup === "container_rotation7" ||
                    selectedGroup === "container_rotation8") && (
                    <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                      <div className="flex items-center gap-3 mb-4 pb-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <HiStar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                          POTENTIAL PROMOTION
                        </h2>
                      </div>
                      <TableComponent table={potentialTable} />
                    </div>
                  )
                ) : (
                  // Untuk job selain Nakhoda, tampilkan di semua group
                  <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                    <div className="flex items-center gap-3 mb-4 pb-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <HiStar className="h-5 w-5 text-yellow-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        POTENTIAL PROMOTION
                      </h2>
                    </div>
                    <TableComponent table={potentialTable} />
                  </div>
                )}
              </>
            )}
          </div>
        )
      )}

      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Pilih Nahkoda Cadangan (Darat Stand By) [Wajib]:
        </label>
        <InputComponent
          cadanganData={standByData}
          value={selectedStandby}
          onChange={setSelectedStandby}
          isSingle={true}
        />
      </div>

      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Pilih Nahkoda Cadangan (Optional):
        </label>
        <InputComponent
          cadanganData={optionalData}
          value={selectedOptional}
          onChange={setSelectedOptional}
          isSingle={true}
        />
      </div>

      <Button
        gradientMonochrome="success"
        className="mt-4 w-full sm:w-auto"
        onClick={handleGenerateSchedule}
      >
        Generate Schedule
      </Button>

      {nahkodaTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">NAHKODA ⛵:</h2>
          <TableComponent table={nahkodaTable} />
        </div>
      )}

      {daratTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">RELIEVER ⚓:</h2>
          <TableComponent table={daratTable} />
        </div>
      )}

      {scheduleTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">ROTATION PLAN 🚢:</h2>
          <TableComponent table={scheduleTable} />
        </div>
      )}

      {(nahkodaTable || scheduleTable) && (
        <Button
          gradientMonochrome="info"
          className="mt-4 ml-2 w-full sm:w-auto"
          onClick={exportToExcel}
        >
          Export ke Excel
        </Button>
      )}
    </>
  );
}
