"use client";

import { Tabs, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { CardComponent } from "./CardComponent";
import { InputComponent } from "./InputComponent";
import { TableComponent } from "./TableComponent";
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

interface PotentialPromotionItem {
  seamancode: string;
  name: string;
  history: string;
  matchCount: number;
}

export function ContainerRotation({
  groups,
  vessel,
  type,
  part,
  job,
}: ContainerProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [cadanganData, setCadanganData] = useState<any[]>([]);
  const [selectedStandby, setSelectedStandby] = useState<string[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);
  const [scheduleTable, setScheduleTable] = useState<TableJson | null>(null);
  const [nahkodaTable, setNahkodaTable] = useState<TableJson | null>(null);
  const [daratTable, setDaratTable] = useState<TableJson | null>(null);
  const [potentialTable, setPotentialTable] = useState<TableJson | null>(null);
  const [mutasiTable, setMutasiTable] = useState<TableJson | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingGroup, setLoadingGroup] = useState(false);

  // Fetch cadangan
  useEffect(() => {
    fetch(`http://192.168.16.44:8080/api/get_cadangan_${job}`)
      .then((res) => res.json())
      .then((data) => setCadanganData(data))
      .catch((err) => {
        console.error("Error fetching cadangan:", err);
        setError("Gagal memuat data nahkoda");
      });
  }, [job]);

  // Fetch mutasi
  useEffect(() => {
    if (!job || !selectedGroup) {
      setMutasiTable(null);
      setLoadingGroup(false);
      return;
    }
  
    const formattedJob = job.toUpperCase();
  
    fetch(`http://192.168.16.44:8080/api/mutasi_filtered?job=${formattedJob}`)
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
            .filter((item) => item.matchCount >= 1)
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
        setLoadingGroup(false); // loading dimatikan HANYA setelah fetch selesai
      });
  }, [selectedGroup, job]);
  
  // Fetch Potential Promosi
  useEffect(() => {
    if (!selectedGroup) {
      setPotentialTable(null);
      return;
    }
  
    const groupShips = groups[selectedGroup] || [];
    const queryParams = groupShips.map(g => `group=${encodeURIComponent(g)}`).join("&");
  
    fetch(`http://192.168.16.44:8080/api/filter_history?${queryParams}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const rawData = data.data;
  
          const rows = rawData
            .map((item: any): PotentialPromotionItem => ({
              seamancode: item.seamancode,
              name: item.name,
              history: item.history,
              matchCount: item.matchCount,
            }))
            .filter((item: PotentialPromotionItem) => item.matchCount >= 0)  // ganti > 1 ke > 0
            .sort((a: PotentialPromotionItem, b: PotentialPromotionItem) => b.matchCount - a.matchCount)
            .slice(0, 10);
  
          setPotentialTable({
            columns: ["seamancode", "name", "history", "matchCount"],  // hapus last_location
            data: rows,
          });
        } else {
          setPotentialTable(null);
        }
      })
      .catch((err) => {
        console.error("Gagal load data filter history:", err);
        setPotentialTable(null);
      });
  }, [selectedGroup]);

  // Auto-pilih DARAT STAND-BY
  useEffect(() => {
    if (cadanganData.length > 0) {
      const standByCodes = cadanganData
        .filter((item) => item.last_location === "DARAT STAND-BY")
        .map((item) => item.seamancode);
      setSelectedStandby(standByCodes);
    }
  }, [cadanganData]);

  // const handleCardClick = (groupKey: string) => {
  //   setSelectedGroup(groupKey);
  // };

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
  
      const response = await fetch("http://192.168.16.44:8080/api/container_rotation", {
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
      if (cleanedScheduleTable?.columns.includes("First Rotation Date")) {
        cleanedScheduleTable = {
          ...cleanedScheduleTable,
          columns: cleanedScheduleTable.columns.filter(
            (col) => col !== "First Rotation Date"
          ),  
          data: cleanedScheduleTable.data.map(({ "First Rotation Date": _, ...rest }) => rest), // Remove first_rotation_date from rows
        };
      }
  
      let updatedNahkodaTable = data.nahkoda || null;
  
      if (updatedNahkodaTable && rawScheduleTable) {
        const hasRotationCol = updatedNahkodaTable.columns.includes("first_rotation_date");
      
        if (!hasRotationCol) {
          const groupShips = groups[selectedGroup] || [];
          const monthsToAdd = groupShips.length;
      
          let baseDate: Date | null = null;
      
          updatedNahkodaTable = {
            ...updatedNahkodaTable,
            columns: [
              ...updatedNahkodaTable.columns,
              "first_rotation_date",
            ],
            data: updatedNahkodaTable.data.map((row, idx) => {
              let rotationDate: Date;
      
              if (idx === 0) {
                // Baris pertama: bulan ini + 1
                const today = new Date();
                rotationDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); 
                baseDate = new Date(rotationDate);
              } else {
                // Baris selanjutnya: +1 bulan dari baris pertama
                if (!baseDate) return { ...row, first_rotation_date: "-" };
                rotationDate = new Date(baseDate);
                rotationDate.setMonth(rotationDate.getMonth() + idx);
              }
      
              // Format mm-yyyy
              const formattedDate =
                String(rotationDate.getMonth() + 1).padStart(2, "0") +
                "-" +
                rotationDate.getFullYear();
      
              return { ...row, first_rotation_date: formattedDate };
            }),
          };
        }
      }
      
      
  
      setScheduleTable(cleanedScheduleTable);
      setNahkodaTable(updatedNahkodaTable);
      setDaratTable(data.darat || null);
  
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Terjadi kesalahan saat memproses");
    }
  };

  const cadanganMap = Object.fromEntries(
    cadanganData.map((item) => [String(item.seamancode), item.name])
  );

  const mutasiItems = mutasiTable?.data.map((item) => {
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

  const potentialItems = potentialTable?.data.map((item) => {
    const seamancodeStr = String(item.seamancode).trim();
    return {
      seamancode: seamancodeStr,
      name: item.name,
      last_location: "",
    };
  }) || [];

  const allCadanganItems = [
    ...mutasiItems,
    ...potentialItems.filter(
      (p) => !mutasiItems.some((m) => m.seamancode === p.seamancode)
    ),
  ];

  const standByData = allCadanganItems;
  const optionalData = allCadanganItems.filter(
    (item) => !selectedStandby.includes(item.seamancode)
  );

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
  
    // Sheet Nahkoda
    if (nahkodaTable) {
      const wsNahkoda = XLSX.utils.json_to_sheet(nahkodaTable.data);
      XLSX.utils.book_append_sheet(wb, wsNahkoda, "Nahkoda");
    }
  
    // Sheet Rotation Plan (langsung sesuai program)
    if (scheduleTable) {
      const wsSchedule = XLSX.utils.json_to_sheet(scheduleTable.data, {
        header: scheduleTable.columns, // pakai header asli dari program
      });
      XLSX.utils.book_append_sheet(wb, wsSchedule, "RotationPlan");
    }
  
    // Sheet Reliever (opsional, kalau ada)
    if (daratTable) {
      const wsDarat = XLSX.utils.json_to_sheet(daratTable.data);
      XLSX.utils.book_append_sheet(wb, wsDarat, "Reliever");
    }
  
    XLSX.writeFile(wb, "Crew_Schedule.xlsx");
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
        <div className="flex justify-center items-center mt-4">
          <Spinner color="info" size="xl" />
          <span className="ml-2 text-gray-700">Loading data...</span>
        </div>
      ) : (
        (mutasiTable || potentialTable) && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mutasiTable && (
              <div className="p-4 border rounded-lg bg-white overflow-x-auto">
                <h2 className="text-lg font-semibold mb-2">HISTORI MUTASI 📄:</h2>
                <TableComponent table={mutasiTable} />
              </div>
            )}

            {potentialTable && (
              <div className="p-4 border rounded-lg bg-white overflow-x-auto">
                <h2 className="text-lg font-semibold mb-2">POTENTIAL PROMOTION 🌟:</h2>
                <TableComponent table={potentialTable} />
              </div>
            )}
          </div>
        )
      )}

      <div className="mt-3 space-y-2">
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

      <div className="mt-3 space-y-2">
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
          Export ke Excel 📊
        </Button>
      )}
    </>
  );
}
