'use client';

import { Button } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { CardComponent } from './CardComponent';
import { InputComponent } from './InputComponent';
import { TableComponent } from './TableComponent';
import { HiUserGroup, HiStar, HiLockClosed } from 'react-icons/hi';
import * as XLSX from 'xlsx';
import { Spinner } from 'flowbite-react';

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

interface LockedItem {
  seamancode: string;
  name: string;
  groupKey: string;
  vessels: string;
  matchCount: number;
  lockedAt: string;
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
  const [promotionCandidatesData, setPromotionCandidatesData] = useState<any[]>(
    []
  );
  const [selectedStandby, setSelectedStandby] = useState<string[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);
  const [scheduleTable, setScheduleTable] = useState<TableJson | null>(null);
  const [nahkodaTable, setNahkodaTable] = useState<TableJson | null>(null);
  const [daratTable, setDaratTable] = useState<TableJson | null>(null);
  const [potentialTable, setPotentialTable] = useState<TableJson | null>(null);
  const [potentialRawData, setPotentialRawData] = useState<any[]>([]);
  const [mutasiTable, setMutasiTable] = useState<TableJson | null>(null);
  const [mutasiRawData, setMutasiRawData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [loadingPotential, setLoadingPotential] = useState(false);
  const [showOnlyMatchMutasi, setShowOnlyMatchMutasi] = useState(false);
  const [showOnlyMatchPotential, setShowOnlyMatchPotential] = useState(false);

  // State untuk locked items
  const [lockedItems, setLockedItems] = useState<Record<string, LockedItem>>(
    {}
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch cadangan job
  useEffect(() => {
    fetch(`${API_BASE_URL}/get_cadangan_${job}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setCadanganData(data))
      .catch(err => {
        console.error(`Error fetching cadangan ${job}:`, err);
        setError(`Gagal memuat data ${job}`);
      });
  }, [job]);

  // Fetch promotion candidates
  useEffect(() => {
    const fetchPromotionCandidates = async () => {
      try {
        const getPromotionEndpoint = (job: string): string => {
          const endpoints: Record<string, string> = {
            nakhoda: `${API_BASE_URL}/seamen/promotion_candidates`,
            KKM: `${API_BASE_URL}/seamen/promotion_candidates_kkm`,
            mualimI: `${API_BASE_URL}/seamen/promotion_candidates_mualimI`,
            masinisII: `${API_BASE_URL}/seamen/promotion_candidates_masinisII`,
          };
          return (
            endpoints[job] || `${API_BASE_URL}/seamen/promotion_candidates`
          );
        };
        const endpoint = getPromotionEndpoint(job);
        const res = await fetch(endpoint);
        const json = await res.json();
        if (json.status === 'success') {
          const formatted = json.data.map((item: any) => ({
            seamancode: String(
              item.code ||
                item.seamancode ||
                item.seaman_code ||
                item.seamanCode ||
                ''
            ),
            name: item.name,
            rank: item.rank,
            history: Array.isArray(item.history)
              ? item.history
                  .filter(
                    (h: string) =>
                      h !== 'PENDING GAJI' &&
                      h !== 'PENDING CUTI' &&
                      h !== 'DARAT STAND-BY' &&
                      h !== 'DARAT BIASA'
                  )
                  .join(', ')
              : item.history || '',
          }));
          setPromotionCandidatesData(formatted);
        }
      } catch (err) {
        console.error('Error fetching promotion candidates:', err);
      }
    };
    fetchPromotionCandidates();
  }, [job, API_BASE_URL]);

  // Fetch mutasi data (history/existing)
  useEffect(() => {
    if (!job || !selectedGroup) {
      setMutasiRawData([]);
      setMutasiTable(null);
      setLoadingGroup(false);
      return;
    }
    setLoadingGroup(true);
    const formattedJob = job.toUpperCase();
    fetch(`${API_BASE_URL}/mutasi_filtered?job=${formattedJob}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
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
                vessels: vesselList.join(', '),
                matchCount,
              };
            })
            // Filter out items yang sudah locked di group lain
            .filter(row => {
              const locked = lockedItems[row.seamancode];
              return !locked || locked.groupKey === selectedGroup;
            })
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 10);
          setMutasiRawData(rows);
        } else {
          setMutasiRawData([]);
        }
      })
      .catch(err => {
        console.error('Gagal load mutasi data:', err);
        setMutasiRawData([]);
      })
      .finally(() => {
        setLoadingGroup(false);
      });
  }, [selectedGroup, job, API_BASE_URL, groups, lockedItems]);

  // Filter mutasi data (history/existing)
  useEffect(() => {
    if (mutasiRawData.length === 0) {
      setMutasiTable(null);
      return;
    }

    const filteredRows = showOnlyMatchMutasi
      ? mutasiRawData.filter(r => r.matchCount > 0)
      : mutasiRawData;

    setMutasiTable({
      columns: ['seamancode', 'name', 'vessels', 'matchCount'],
      data: filteredRows,
    });
  }, [mutasiRawData, showOnlyMatchMutasi]);

  // Fetch potential promotion data
  useEffect(() => {
    if (!selectedGroup) {
      setPotentialRawData([]);
      setPotentialTable(null);
      setLoadingPotential(false);
      return;
    }

    setLoadingPotential(true);
    const controller = new AbortController();
    const groupShips = groups[selectedGroup] || [];
    const queryParams = groupShips
      .map(g => `group=${encodeURIComponent(g)}`)
      .join('&');
    const historyUrl = `${API_BASE_URL}/filter_history?${queryParams}`;
    const getPromotionEndpoint = (job: string): string => {
      const endpoints: Record<string, string> = {
        nakhoda: `${API_BASE_URL}/seamen/promotion_candidates`,
        KKM: `${API_BASE_URL}/seamen/promotion_candidates_kkm`,
        mualimI: `${API_BASE_URL}/seamen/promotion_candidates_mualimI`,
        masinisII: `${API_BASE_URL}/seamen/promotion_candidates_masinisII`,
      };
      return endpoints[job] || `${API_BASE_URL}/seamen/promotion_candidates`;
    };
    const candidateUrl = getPromotionEndpoint(job);
    const getCode = (x: any) =>
      String(
        x?.seamancode ?? x?.code ?? x?.seaman_code ?? x?.seamanCode ?? ''
      ).trim();
    Promise.all([
      fetch(historyUrl, { signal: controller.signal }).then(r => r.json()),
      fetch(candidateUrl, { signal: controller.signal }).then(r => r.json()),
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
        setPotentialRawData(rows);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Gagal load potential:', err);
        setPotentialRawData([]);
      })
      .finally(() => {
        setLoadingPotential(false);
      });
    return () => controller.abort();
  }, [selectedGroup, job, API_BASE_URL, groups]);

  // Filter potential promotion data
  useEffect(() => {
    if (potentialRawData.length === 0) {
      setPotentialTable(null);
      return;
    }

    const filteredRows = showOnlyMatchPotential
      ? potentialRawData.filter(r => r.matchCount > 0)
      : potentialRawData;

    setPotentialTable({
      columns: ['seamancode', 'name', 'history', 'matchCount'],
      data: filteredRows,
    });
  }, [potentialRawData, showOnlyMatchPotential]);

  // Auto-pilih data dengan last_location DARAT STAND-BY
  useEffect(() => {
    if (cadanganData.length > 0) {
      const standByCodes = cadanganData
        .filter(item => item.last_location === 'DARAT STAND-BY')
        .map(item => item.seamancode);
      setSelectedStandby(standByCodes);
    }
  }, [cadanganData]);

  // Handle card click
  const handleCardClick = async (groupKey: string) => {
    setSelectedGroup(groupKey);
    setLoadingGroup(true);
  };

  // Handle Save Locked Items (Placeholder)
  const handleSaveLockedItems = async () => {
    try {
      // TODO: Implement API call to save locked items
      console.log('Saving locked items:', lockedItems);

      // Placeholder untuk API call
      // const response = await fetch(`${API_BASE_URL}/save_locked_items`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ lockedItems, job }),
      // });

      // Simulasi success
      alert('Data berhasil disimpan! (Placeholder)');
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving locked items:', err);
      alert('Gagal menyimpan data!');
    }
  };

  // Generate schedule
  const handleGenerateSchedule = async () => {
    setError('');
    if (!selectedGroup) {
      setError('Silakan pilih grup terlebih dahulu!');
      return;
    }
    if (selectedStandby.length === 0) {
      setError("Minimal 1 Nahkoda 'Darat Stand-By' harus dipilih!");
      return;
    }
    try {
      const mappedGroup = selectedGroup.replace('container_rotation', vessel);
      const payload = {
        selected_group: mappedGroup,
        cadangan: selectedStandby,
        cadangan2: selectedOptional,
        type: type,
        part: part,
      };
      const response = await fetch(`${API_BASE_URL}/container_rotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal generate schedule');
      }
      const data: ApiResponse = await response.json();
      const rawScheduleTable = data.schedule || null;
      if (rawScheduleTable) {
        console.log('Schedule Columns:', rawScheduleTable.columns);
      }
      let cleanedScheduleTable = rawScheduleTable;
      if (cleanedScheduleTable?.columns?.includes('First Rotation Date')) {
        cleanedScheduleTable = {
          ...cleanedScheduleTable,
          columns: cleanedScheduleTable.columns.filter(
            (c: string) => c !== 'First Rotation Date'
          ),
          data: cleanedScheduleTable.data.map(
            ({ ['First Rotation Date']: _drop, ...rest }: any) => rest
          ),
        };
      }
      let updatedNahkodaTable = data.nahkoda || null;
      if (updatedNahkodaTable && rawScheduleTable) {
        const monthToNum: Record<string, string> = {
          JANUARY: '01',
          JAN: '01',
          JANUARI: '01',
          FEBRUARY: '02',
          FEB: '02',
          FEBRUARI: '02',
          MARCH: '03',
          MAR: '03',
          MARET: '03',
          APRIL: '04',
          APR: '04',
          MAY: '05',
          MEI: '05',
          JUNE: '06',
          JUN: '06',
          JUNI: '06',
          JULY: '07',
          JUL: '07',
          JULI: '07',
          AUGUST: '08',
          AUG: '08',
          AGUSTUS: '08',
          SEPTEMBER: '09',
          SEP: '09',
          SEPT: '09',
          OCTOBER: '10',
          OCT: '10',
          OKTOBER: '10',
          NOVEMBER: '11',
          NOV: '11',
          DECEMBER: '12',
          DEC: '12',
          DESEMBER: '12',
        };
        const normalize = (s: any) =>
          String(s ?? '')
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const monthColsInfo = (rawScheduleTable.columns || [])
          .map((col: string) => {
            const hdr = normalize(col);
            const m = hdr.match(/^([A-Za-zÀ-ÿ\.]+)\s+(\d{4})$/);
            if (!m) return null;
            let mon = m[1].toUpperCase().replace(/\.$/, '');
            if (!monthToNum[mon]) {
              let abbr = mon.slice(0, 3);
              if (abbr === 'SEP' || abbr === 'SEPT') abbr = 'SEP';
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

        if (!updatedNahkodaTable.columns.includes('first_rotation_date')) {
          updatedNahkodaTable = {
            ...updatedNahkodaTable,
            columns: [...updatedNahkodaTable.columns, 'first_rotation_date'],
          };
        }

        updatedNahkodaTable = {
          ...updatedNahkodaTable,
          data: updatedNahkodaTable.data.map((r: any) => {
            const idx = normalize(r.index ?? r.INDEX ?? r.Index).toUpperCase();
            const seen = firstSeen[idx];
            const firstDate = seen ? `${seen.mm}-${seen.year}` : '-';
            return { ...r, first_rotation_date: firstDate };
          }),
        };
      }
      setScheduleTable(cleanedScheduleTable);
      setNahkodaTable(updatedNahkodaTable);
      setDaratTable(data.darat || null);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses');
    }
  };

  // Gabungkan data cadangan dari mutasi, potential, dan promotion candidates
  const mutasiItems =
    mutasiTable?.data.map(item => {
      const seamancodeStr = String(item.seamancode).trim();
      const found = cadanganData.find(
        c => String(c.seamancode).trim() === seamancodeStr
      );
      const name = found?.name || item.name || 'Unknown';
      return {
        seamancode: seamancodeStr,
        name,
        last_location: '',
      };
    }) || [];

  // Filter potential items yang sudah ada di mutasiItems
  const potentialItems =
    potentialTable?.data.map(item => {
      const seamancodeStr = String(item.seamancode).trim();
      return {
        seamancode: seamancodeStr,
        name: item.name,
        last_location: '',
      };
    }) || [];

  // Tambahkan promotion candidates ke daftar
  const promotionItems = promotionCandidatesData.map(item => ({
    seamancode: String(item.seamancode).trim(),
    name: item.name,
    last_location: '',
  }));

  // Gabungkan semua data cadangan tanpa duplikasi
  const allCadanganItems = [
    ...mutasiItems,
    ...potentialItems.filter(
      p => !mutasiItems.some(m => m.seamancode === p.seamancode)
    ),
    ...promotionItems.filter(
      pr =>
        !mutasiItems.some(m => m.seamancode === pr.seamancode) &&
        !potentialItems.some(p => p.seamancode === pr.seamancode)
    ),
  ];

  // Pisahkan data cadangan menjadi standByData dan optionalData
  const standByData = allCadanganItems;
  const optionalData = allCadanganItems.filter(
    item => !selectedStandby.includes(item.seamancode)
  );

  // Export semua tabel ke Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    if (nahkodaTable) {
      const wsNahkoda = XLSX.utils.json_to_sheet(nahkodaTable.data);
      XLSX.utils.book_append_sheet(wb, wsNahkoda, 'Nahkoda');
    }
    if (scheduleTable) {
      const wsSchedule = XLSX.utils.json_to_sheet(scheduleTable.data, {
        header: scheduleTable.columns,
      });
      XLSX.utils.book_append_sheet(wb, wsSchedule, 'RotationPlan');
    }
    if (daratTable) {
      const wsDarat = XLSX.utils.json_to_sheet(daratTable.data);
      XLSX.utils.book_append_sheet(wb, wsDarat, 'Reliever');
    }
    XLSX.writeFile(wb, 'Crew_Schedule.xlsx');
  };

  // Dapatkan tampilan nama job yang lebih baik
  const getJobDisplayName = (job: string): string => {
    switch (job) {
      case 'nakhoda':
        return 'NAHKODA';
      case 'KKM':
        return 'KKM';
      case 'mualimI':
        return 'MUALIM I';
      case 'masinisII':
        return 'MASINIS II';
      default:
        return job.toUpperCase();
    }
  };

  // Get locked items untuk group yang dipilih
  const getLockedItemsForCurrentGroup = () => {
    if (!selectedGroup) return [];
    return Object.values(lockedItems).filter(
      item => item.groupKey === selectedGroup
    );
  };

  return (
    <>
      <div className="text-3xl mb-3 font-bold">Generate Ship Crew Schedule</div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {/* Save Button - tampil jika ada perubahan yang belum disimpan */}
      {hasUnsavedChanges && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-yellow-800">
              Ada perubahan yang belum disimpan
            </span>
          </div>
          <Button
            gradientMonochrome="info"
            size="sm"
            onClick={handleSaveLockedItems}
          >
            Simpan Data Lock
          </Button>
        </div>
      )}

      {/* Card for group selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => (
          <CardComponent
            key={groupKey}
            groupName={`Group ${groupKey.replace('container_rotation', '')}`}
            listShip={ships.join(', ')}
            isActive={selectedGroup === groupKey}
            onClick={() => handleCardClick(groupKey)}
          />
        ))}
      </div>

      {/* Loading state for group selection */}
      {loadingGroup ? (
        <div className="flex flex-col justify-center items-center mt-6">
          <Spinner color="info" size="xl" />
          <span className="mt-2 text-gray-700">Loading data...</span>
        </div>
      ) : (
        (mutasiTable || potentialTable) && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* EXISTING - Tampil di semua group */}
            {mutasiTable && (
              <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                <div className="flex items-center justify-between gap-3 mb-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <HiUserGroup className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {getJobDisplayName(job)} EXISTING
                    </h2>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showOnlyMatchMutasi}
                      onChange={e => setShowOnlyMatchMutasi(e.target.checked)}
                      className="rounded"
                    />
                    Tampilkan matchCount &gt; 0 saja
                  </label>
                </div>

                {/* Custom Table with Lock/Unlock Actions */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Seaman Code</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Vessels</th>
                        <th className="px-4 py-3">Match Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mutasiTable.data.map((item, idx) => {
                        const isLocked = !!lockedItems[item.seamancode];
                        const isLockedInCurrentGroup =
                          lockedItems[item.seamancode]?.groupKey ===
                          selectedGroup;

                        return (
                          <tr
                            key={idx}
                            className={`border-b hover:bg-gray-50 ${
                              isLocked && isLockedInCurrentGroup
                                ? 'bg-green-50'
                                : ''
                            }`}
                          >
                            <td className="px-4 py-3 font-medium">
                              {item.seamancode}
                            </td>
                            <td className="px-4 py-3">{item.name}</td>
                            <td className="px-4 py-3 text-xs">
                              {item.vessels}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.matchCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Display locked items for current group */}
                {getLockedItemsForCurrentGroup().length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">
                      Locked Items ({getLockedItemsForCurrentGroup().length}
                      ):
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getLockedItemsForCurrentGroup().map(item => (
                        <span
                          key={item.seamancode}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-green-300 rounded-md text-xs"
                        >
                          <HiLockClosed className="h-3 w-3 text-green-600" />
                          {item.seamancode} - {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* POTENTIAL PROMOTION - Kondisi berbeda per job */}
            {(() => {
              // Untuk KKM dan masinisII: tampil di rotation6 dan rotation7
              const isKKMorMasinisII = job === 'KKM' || job === 'masinisII';
              const showForKKMorMasinisII =
                isKKMorMasinisII &&
                (selectedGroup === 'container_rotation6' ||
                  selectedGroup === 'container_rotation7');

              // Untuk nahkoda dan mualimI: tampil di rotation7 dan rotation8
              const isNahkodaOrMualimI = job === 'nakhoda' || job === 'mualimI';
              const showForNahkodaOrMualimI =
                isNahkodaOrMualimI &&
                (selectedGroup === 'container_rotation7' ||
                  selectedGroup === 'container_rotation8');

              return (
                (showForKKMorMasinisII || showForNahkodaOrMualimI) && (
                  <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <HiStar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                          POTENTIAL PROMOTION
                        </h2>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={showOnlyMatchPotential}
                          onChange={e =>
                            setShowOnlyMatchPotential(e.target.checked)
                          }
                          className="rounded"
                        />
                        Tampilkan matchCount &gt; 0 saja
                      </label>
                    </div>

                    {loadingPotential ? (
                      <div className="flex justify-center items-center py-8">
                        <Spinner color="info" size="md" />
                        <span className="ml-2 text-gray-700">
                          Loading data...
                        </span>
                      </div>
                    ) : potentialTable && potentialTable.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                              <th className="px-4 py-3">Seaman Code</th>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">History</th>
                              <th className="px-4 py-3">Match Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {potentialTable.data.map((item, idx) => (
                              <tr
                                key={idx}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 font-medium">
                                  {item.seamancode}
                                </td>
                                <td className="px-4 py-3">{item.name}</td>
                                <td className="px-4 py-3 text-xs">
                                  {item.history}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.matchCount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Tidak ada {getJobDisplayName(job)} yang mendapatkan
                        potensial promosi
                      </div>
                    )}
                  </div>
                )
              );
            })()}
          </div>
        )
      )}

      {/* Card for group selection */}
      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Pilih {getJobDisplayName(job)} Cadangan (Darat Stand By) [Wajib]:
        </label>
        <InputComponent
          cadanganData={standByData}
          value={selectedStandby}
          onChange={setSelectedStandby}
          isSingle={true}
        />
      </div>

      {/* Card for optional standby selection */}
      <div className="mt-4 space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Pilih {getJobDisplayName(job)} Cadangan (Reliever):
        </label>
        <InputComponent
          cadanganData={optionalData}
          value={selectedOptional}
          onChange={setSelectedOptional}
          isSingle={true}
        />
      </div>

      {/* Button for generating schedule */}
      <Button
        gradientMonochrome="success"
        className="mt-4 w-full sm:w-auto"
        onClick={handleGenerateSchedule}
      >
        Generate Schedule
      </Button>

      {nahkodaTable && (
        <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {getJobDisplayName(job)}
            </h2>
          </div>
          <TableComponent table={nahkodaTable} />
        </div>
      )}

      {daratTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">RELIEVER:</h2>
          <TableComponent table={daratTable} />
        </div>
      )}

      {scheduleTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">ROTATION PLAN:</h2>
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
