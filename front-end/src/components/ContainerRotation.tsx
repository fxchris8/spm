'use client';

import { Button } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { CardComponent } from './CardComponent';
import { InputComponent } from './InputComponent';
import { TableComponent } from './TableComponent';
import { AlertComponent } from './AlertComponent';
import { HiUserGroup, HiStar, HiLockClosed, HiLockOpen } from 'react-icons/hi';
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

interface LockedRotation {
  groupKey: string;
  job: string;
  scheduleTable: TableJson;
  nahkodaTable: TableJson;
  daratTable: TableJson | null;
  lockedSeamanCodes: string[]; // All locked codes (for backward compatibility)
  lockedCadanganCodes: string[]; // Only cadangan/nahkoda codes (for filtering EXISTING)
  lockedRelieverCodes: string[]; // Only reliever/darat codes (not used for filtering)
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
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [showOnlyMatchMutasi, setShowOnlyMatchMutasi] = useState(false);
  const [showOnlyMatchPotential, setShowOnlyMatchPotential] = useState(false);

  // State untuk Alert Component
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // State untuk locked rotations
  const [lockedRotations, setLockedRotations] = useState<
    Record<string, LockedRotation>
  >({});
  const [isCurrentGroupLocked, setIsCurrentGroupLocked] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Helper function to show alert
  const showAlert = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => {
    setAlertInfo({ show: true, type, message });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlertInfo({ show: false, type: 'info', message: '' });
    }, 5000);
  };

  // Reset state saat ganti job (pindah tabs)
  useEffect(() => {
    // Clear semua state saat ganti job
    setSelectedGroup(null);
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
    setSelectedStandby([]);
    setSelectedOptional([]);
    setMutasiRawData([]);
    setPotentialRawData([]);
    setError('');
  }, [job]); // Re-run saat job berubah

  // Load locked rotations from API on mount
  useEffect(() => {
    const loadLockedRotations = async () => {
      try {
        // Load from API (server-side persistent with Supabase)
        const response = await fetch(
          `${API_BASE_URL}/locked_rotations?job=${job}`
        );
        const data = await response.json();

        if (data.status === 'success') {
          const locksMap: Record<string, LockedRotation> = {};
          data.data.forEach((item: any) => {
            // Parse locked codes
            const allLockedCodes = item.locked_seaman_codes || [];
            const nahkodaData = item.crew_data?.data || [];
            const daratData = item.reliever_data?.data || [];

            // 🔍 FIX: Add all case variations including 'Seamancode'
            const cadanganCodes = nahkodaData
              .map((row: any) => {
                const code = String(
                  row.seamancode ||
                    row.SEAMANCODE ||
                    row.Seamancode || // ✅ ADD THIS
                    row.SeamanCode ||
                    row.seaman_code ||
                    row.SEAMAN_CODE ||
                    ''
                ).trim();
                return code;
              })
              .filter((code: string) => code !== '');

            // 🔍 FIX: Same for reliever codes
            const relieverCodes = daratData
              .map((row: any) => {
                const code = String(
                  row.seamancode ||
                    row.SEAMANCODE ||
                    row.Seamancode || // ✅ ADD THIS
                    row.SeamanCode ||
                    row.seaman_code ||
                    row.SEAMAN_CODE ||
                    ''
                ).trim();
                return code;
              })
              .filter((code: string) => code !== '');

            locksMap[item.group_key] = {
              groupKey: item.group_key,
              job: item.job,
              scheduleTable: item.schedule_data,
              nahkodaTable: item.crew_data,
              daratTable: item.reliever_data,
              lockedSeamanCodes: allLockedCodes,
              lockedCadanganCodes: cadanganCodes,
              lockedRelieverCodes: relieverCodes,
              lockedAt: item.locked_at,
            };
          });

          setLockedRotations(locksMap);
          console.log(
            `✅ Loaded ${
              Object.keys(locksMap).length
            } locked rotations for ${job}`
          );

          // Log untuk verify
          Object.entries(locksMap).forEach(([key, lock]) => {
            console.log(
              `${key}: ${lock.lockedCadanganCodes.length} cadangan codes`
            );
          });
        }
      } catch (err) {
        console.error('Error loading locked rotations:', err);
        try {
          const savedLocks = localStorage.getItem(`locked_rotations_${job}`);
          if (savedLocks) {
            setLockedRotations(JSON.parse(savedLocks));
            console.log('Loaded locked rotations from localStorage (fallback)');
          }
        } catch (localErr) {
          console.error('Error loading from localStorage:', localErr);
        }
      }
    };

    loadLockedRotations();
  }, [job, API_BASE_URL]);

  // Check if current group is locked
  useEffect(() => {
    if (selectedGroup) {
      const locked = lockedRotations[selectedGroup];
      setIsCurrentGroupLocked(!!locked);

      // Jika group sudah di-lock, tampilkan data yang tersimpan
      if (locked) {
        setScheduleTable(locked.scheduleTable);
        setNahkodaTable(locked.nahkodaTable);
        setDaratTable(locked.daratTable);
      } else {
        // Jika group TIDAK di-lock, CLEAR semua tables
        // Agar tidak muncul data dari group sebelumnya
        setScheduleTable(null);
        setNahkodaTable(null);
        setDaratTable(null);
      }
    }
  }, [selectedGroup, lockedRotations]);

  // Fetch cadangan job - no filtering for locked codes
  useEffect(() => {
    fetch(`${API_BASE_URL}/get_cadangan_${job}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCadanganData(data);
      })
      .catch(err => {
        console.error(`Error fetching cadangan ${job}:`, err);
        setError(`Gagal memuat data ${job}`);
      });
  }, [job, API_BASE_URL]);

  // Fetch promotion candidates - no filtering for locked codes
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

  // Fetch mutasi data - backend handles filtering of locked codes
  useEffect(() => {
    if (!job || !selectedGroup) {
      setMutasiRawData([]);
      setMutasiTable(null);
      setLoadingGroup(false);
      return;
    }
    setLoadingGroup(true);
    const formattedJob = job.toUpperCase();

    // 🔍 FIX: Case-insensitive job comparison
    const lockedCadanganCodes = Object.values(lockedRotations)
      .filter(lock => lock.job?.toUpperCase() === job.toUpperCase()) // ✅ Compare uppercase
      .flatMap(lock => lock.lockedCadanganCodes || []);

    // console.log('=== MUTASI FILTERING DEBUG ===');
    // console.log('Selected Group:', selectedGroup);
    // console.log('Job:', job);
    // console.log('Locked Cadangan Codes:', lockedCadanganCodes);
    // console.log('Number of locked codes:', lockedCadanganCodes.length);

    // const gegoloCode = '20170046';
    // console.log(
    //   `Is ${gegoloCode} locked?`,
    //   lockedCadanganCodes.includes(gegoloCode)
    // );

    // Send locked codes to backend for filtering
    const params = new URLSearchParams({
      job: formattedJob,
    });

    // Add locked codes as query parameter if any
    if (lockedCadanganCodes.length > 0) {
      params.append('locked_codes', lockedCadanganCodes.join(','));
    }

    const apiUrl = `${API_BASE_URL}/mutasi_filtered?${params.toString()}`;

    fetch(apiUrl)
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
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 50);

          setMutasiRawData(rows);
        } else {
          setMutasiRawData([]);
        }
        // console.log('=== END DEBUG ===');
      })
      .catch(err => {
        console.error('Gagal load mutasi data:', err);
        setMutasiRawData([]);
      })
      .finally(() => {
        setLoadingGroup(false);
      });
  }, [selectedGroup, job, API_BASE_URL, groups, lockedRotations]);

  // Filter mutasi data
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

  // Fetch potential promotion data - filter locked codes
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
          .slice(0, 50);
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
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
  };

  // Handle Lock Rotation - Save to Database
  const handleLockRotation = async () => {
    if (!selectedGroup || !scheduleTable || !nahkodaTable) {
      showAlert(
        'warning',
        'Tidak ada data yang bisa di-lock. Generate schedule terlebih dahulu!'
      );
      return;
    }

    // Extract seaman codes from nahkoda table (CADANGAN - will be filtered from EXISTING)
    const lockedCadanganCodes = nahkodaTable.data.map((row: any) =>
      String(
        row.seamancode ||
          row.SEAMANCODE ||
          row.Seamancode || // ✅ ADD THIS
          row.SeamanCode ||
          row.seaman_code ||
          row.SEAMAN_CODE ||
          ''
      )
    );

    // Extract seaman codes from darat table (RELIEVER - will NOT be filtered)
    const lockedRelieverCodes: string[] = [];
    if (daratTable) {
      const daratCodes = daratTable.data.map((row: any) =>
        String(
          row.seamancode ||
            row.SEAMANCODE ||
            row.Seamancode || // ✅ ADD THIS
            row.SeamanCode ||
            row.seaman_code ||
            row.SEAMAN_CODE ||
            ''
        )
      );
      lockedRelieverCodes.push(...daratCodes);
    }

    // All locked codes (for backward compatibility)
    const lockedSeamanCodes = [...lockedCadanganCodes, ...lockedRelieverCodes];

    try {
      // Save to database via API
      const response = await fetch(`${API_BASE_URL}/locked_rotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupKey: selectedGroup,
          job: job.toUpperCase(),
          scheduleTable: scheduleTable,
          nahkodaTable: nahkodaTable,
          daratTable: daratTable,
          lockedSeamanCodes: lockedSeamanCodes,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Update local state
        const lockedRotation: LockedRotation = {
          groupKey: selectedGroup,
          job: job,
          scheduleTable: scheduleTable,
          nahkodaTable: nahkodaTable,
          daratTable: daratTable,
          lockedSeamanCodes: lockedSeamanCodes,
          lockedCadanganCodes: lockedCadanganCodes,
          lockedRelieverCodes: lockedRelieverCodes,
          lockedAt: new Date().toISOString(),
        };

        const updatedLocks = {
          ...lockedRotations,
          [selectedGroup]: lockedRotation,
        };

        setLockedRotations(updatedLocks);

        // Backup ke localStorage juga
        localStorage.setItem(
          `locked_rotations_${job}`,
          JSON.stringify(updatedLocks)
        );

        showAlert('success', result.message);
      } else {
        showAlert('error', `Gagal menyimpan lock: ${result.message}`);
      }
    } catch (error) {
      console.error('Error locking rotation:', error);
      showAlert('error', `Terjadi kesalahan saat menyimpan lock: ${error}`);
    }
  };

  // Handle Unlock Rotation - Delete from Database
  const handleUnlockRotation = async () => {
    if (!selectedGroup) {
      showAlert('warning', 'Pilih group terlebih dahulu!');
      return;
    }

    if (!lockedRotations[selectedGroup]) {
      showAlert('warning', 'Group ini belum di-lock!');
      return;
    }

    try {
      // Delete from database via API
      const response = await fetch(
        `${API_BASE_URL}/locked_rotations/${selectedGroup}?job=${job}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        // Update local state
        const updatedLocks = { ...lockedRotations };
        delete updatedLocks[selectedGroup];

        setLockedRotations(updatedLocks);

        // Update localStorage juga
        localStorage.setItem(
          `locked_rotations_${job}`,
          JSON.stringify(updatedLocks)
        );

        // Clear current tables
        setScheduleTable(null);
        setNahkodaTable(null);
        setDaratTable(null);

        showAlert('success', result.message);
      } else {
        showAlert('error', `Gagal unlock: ${result.message}`);
      }
    } catch (error) {
      console.error('Error unlocking rotation:', error);
      showAlert('error', `Terjadi kesalahan saat unlock: ${error}`);
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
      setError(
        `Minimal 1 ${getJobDisplayName(job)} 'Darat Stand-By' harus dipilih!`
      );
      return;
    }

    setLoadingGenerate(true);

    try {
      const mappedGroup = selectedGroup.replace('container_rotation', vessel);
      const payload = {
        selected_group: mappedGroup,
        cadangan: selectedStandby,
        cadangan2: selectedOptional,
        type: type,
        part: part,
      };

      const formattedJob = job.toUpperCase();

      const response = await fetch(
        `${API_BASE_URL}/container_rotation?job=${formattedJob}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal generate schedule');
      }

      const data: ApiResponse = await response.json();

      const rawScheduleTable = data.schedule || null;
      let cleanedScheduleTable = rawScheduleTable;
      if (cleanedScheduleTable?.columns?.includes('First Rotation Date')) {
        cleanedScheduleTable = {
          ...cleanedScheduleTable,
          columns: cleanedScheduleTable.columns.filter(
            (c: string) => c !== 'First Rotation Date'
          ),
          data: cleanedScheduleTable.data.map((row: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ['First Rotation Date']: _unused, ...rest } = row;
            return rest;
          }),
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

      showAlert('success', 'Schedule berhasil di-generate!');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses');
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Gabungkan data cadangan
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

  const potentialItems =
    potentialTable?.data.map(item => {
      const seamancodeStr = String(item.seamancode).trim();
      return {
        seamancode: seamancodeStr,
        name: item.name,
        last_location: '',
      };
    }) || [];

  const promotionItems = promotionCandidatesData.map(item => ({
    seamancode: String(item.seamancode).trim(),
    name: item.name,
    last_location: '',
  }));

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

  // Filter out locked CADANGAN codes (not reliever) from select fields
  const lockedCadanganCodes = Object.values(lockedRotations)
    .filter(lock => lock.job?.toUpperCase() === job.toUpperCase()) // ✅ Case insensitive
    .flatMap(lock => lock.lockedCadanganCodes || []);

  const filteredCadanganItems = allCadanganItems.filter(
    item => !lockedCadanganCodes.includes(item.seamancode)
  );

  const standByData = filteredCadanganItems;
  const optionalData = filteredCadanganItems.filter(
    item => !selectedStandby.includes(item.seamancode)
  );

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    if (nahkodaTable) {
      const wsNahkoda = XLSX.utils.json_to_sheet(nahkodaTable.data);
      XLSX.utils.book_append_sheet(wb, wsNahkoda, getJobDisplayName(job));
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
    XLSX.writeFile(
      wb,
      `${getJobDisplayName(job)}_Schedule_${selectedGroup}.xlsx`
    );
  };

  // Get job display name
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

  return (
    <>
      <div className="text-3xl mb-3 font-bold">Generate Ship Crew Schedule</div>

      {/* Alert Component */}
      {alertInfo.show && (
        <AlertComponent
          type={alertInfo.type}
          message={alertInfo.message}
          onClose={() =>
            setAlertInfo({ show: false, type: 'info', message: '' })
          }
        />
      )}

      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {/* Locked Status Info */}
      {selectedGroup && isCurrentGroupLocked && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiLockClosed className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Rotasi untuk {selectedGroup} sudah di-lock
            </span>
          </div>
        </div>
      )}

      {/* Card for group selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => {
          const isLocked = !!lockedRotations[groupKey];
          return (
            <div key={groupKey} className="relative">
              {isLocked && (
                <div className="absolute top-2 right-2 z-10">
                  <HiLockClosed className="h-5 w-5 text-green-600" />
                </div>
              )}
              <CardComponent
                groupName={`Group ${groupKey.replace(
                  'container_rotation',
                  ''
                )}`}
                listShip={ships.join(', ')}
                isActive={selectedGroup === groupKey}
                onClick={() => handleCardClick(groupKey)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading state for group selection */}
      {loadingGroup && !isCurrentGroupLocked ? (
        <div className="flex flex-col justify-center items-center mt-6">
          <Spinner color="info" size="xl" />
          <span className="mt-2 text-gray-700">Loading data...</span>
        </div>
      ) : (
        (mutasiTable || potentialTable || isCurrentGroupLocked) && (
          <>
            {!isCurrentGroupLocked && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* EXISTING */}
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
                          onChange={e =>
                            setShowOnlyMatchMutasi(e.target.checked)
                          }
                          className="rounded"
                        />
                        Tampilkan matchCount &gt; 0 saja
                      </label>
                    </div>

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
                          {mutasiTable.data.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* POTENTIAL PROMOTION */}
                {(() => {
                  const isKKMorMasinisII = job === 'KKM' || job === 'masinisII';
                  const showForKKMorMasinisII =
                    isKKMorMasinisII &&
                    (selectedGroup === 'container_rotation6' ||
                      selectedGroup === 'container_rotation7');

                  const isNahkodaOrMualimI =
                    job === 'nakhoda' || job === 'mualimI';
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
            )}

            {/* Input Section - Only show if not locked */}
            {!isCurrentGroupLocked && (
              <>
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Pilih {getJobDisplayName(job)} Cadangan (Darat Stand By)
                    [Wajib]:
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
                    Pilih {getJobDisplayName(job)} Cadangan (Reliever):
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
                  disabled={loadingGenerate || isCurrentGroupLocked}
                >
                  {loadingGenerate ? (
                    <>
                      <Spinner size="sm" light className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Schedule'
                  )}
                </Button>
              </>
            )}
          </>
        )
      )}

      {/* Results Tables */}
      {nahkodaTable && (
        <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {getJobDisplayName(job)}
            </h2>
            {isCurrentGroupLocked && (
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">
                LOCKED
              </span>
            )}
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

      {/* Action Buttons */}
      {(nahkodaTable || scheduleTable) && (
        <div className="flex justify-start gap-4 mt-4">
          <Button
            gradientMonochrome="info"
            className="w-full sm:w-auto"
            onClick={exportToExcel}
          >
            Export ke Excel
          </Button>

          {!isCurrentGroupLocked ? (
            <Button
              color="green"
              className="w-full sm:w-auto"
              onClick={handleLockRotation}
            >
              <HiLockClosed className="mr-2 h-5 w-5" />
              Lock Rotasi
            </Button>
          ) : (
            <Button
              color="red"
              className="w-full sm:w-auto"
              onClick={handleUnlockRotation}
            >
              <HiLockOpen className="mr-2 h-5 w-5" />
              Unlock Rotasi
            </Button>
          )}
        </div>
      )}
    </>
  );
}
