'use client';

import { Button, Spinner } from 'flowbite-react';
import { useState, useEffect, useCallback } from 'react';
import {
  HiUserRemove,
  HiSwitchHorizontal,
  HiLockClosed,
  HiLockOpen,
  HiCheckCircle,
  HiStar,
} from 'react-icons/hi';
import { CardComponent } from './CardComponent';

interface ScheduleProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

interface PromotionCandidate {
  seamancode: string | number;
  name: string;
  rank: string;
  history: string;
  matchCount: number;
}

interface PromotionTableProps {
  job: string;
}

interface CrewToRelieve {
  seamancode: string;
  name: string;
  currentVessel: string;
  currentPosition: string;
  daysRemaining: number;
  daysElapsed: number;
  endDate: string;
  phoneNumber: string;
  certificate: string;
  reliefReason: 'elapsed' | 'remaining';
}

interface ReplacementOption {
  seamancode: string;
  name: string;
  position: string;
  lastVessel: string;
  status: string;
  certificate: string;
  experience: string;
  phoneNumber: string;
  age: string;
  daysSinceLastVessel: number;
}

// Component untuk tabel Potensial Promosi
function PromotionCandidatesTable({ job }: PromotionTableProps) {
  const [promotionCandidates, setPromotionCandidates] = useState<
    PromotionCandidate[]
  >([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPromotionCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const fetchPromotionCandidates = async () => {
    setLoading(true);
    try {
      const getPromotionEndpoint = (job: string): string => {
        const endpoints: Record<string, string> = {
          mualimII: `${API_BASE_URL}/seamen/promotion_candidates_mualimII`,
          mualimIII: `${API_BASE_URL}/seamen/promotion_candidates_mualimIII`,
          masinisIII: `${API_BASE_URL}/seamen/promotion_candidates_masinisIII`,
          masinisIV: `${API_BASE_URL}/seamen/promotion_candidates_masinisIV`,
        };
        return endpoints[job] || `${API_BASE_URL}/seamen/promotion_candidates`;
      };

      const endpoint = getPromotionEndpoint(job);
      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.status === 'success') {
        const formatted = result.data.map((item: any) => ({
          seamancode: item.code || item.seamancode || 0,
          name: item.name || '',
          rank: item.rank || item.last_position || '',
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
            : '',
          matchCount: item.matchCount || 0,
        }));
        setPromotionCandidates(formatted);
        console.log('🟣 PROMOTION CANDIDATES LOADED:', {
          job,
          endpoint,
          count: formatted.length,
        });
      } else {
        console.error('Error fetching promotion candidates:', result.message);
        setPromotionCandidates([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setPromotionCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const formatJobName = (jobName: string): string => {
    const jobMapping: Record<string, string> = {
      mualimII: 'MUALIM II',
      mualimIII: 'MUALIM III',
      masinisIII: 'MASINIS III',
      masinisIV: 'MASINIS IV',
      'MUALIM II': 'MUALIM III',
      'MUALIM III': 'MUALIM II',
      'MASINIS III': 'MASINIS IV',
      'MASINIS IV': 'MASINIS III',
    };
    return jobMapping[jobName] || jobName;
  };

  if (loading) {
    return (
      <div className="mt-4 p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-2 text-gray-600">Loading promotion data...</span>
        </div>
      </div>
    );
  }

  if (promotionCandidates.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
      <div className="flex items-center gap-3 mb-4 pb-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <HiStar className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            POTENTIAL PROMOTION TO {formatJobName(job)}
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Seaman Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Rank Saat Ini</th>
              <th className="px-4 py-3">History</th>
              <th className="px-4 py-3">Match Count</th>
            </tr>
          </thead>
          <tbody>
            {promotionCandidates.map((candidate, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {candidate.seamancode}
                </td>
                <td className="px-4 py-3">{candidate.name}</td>
                <td className="px-4 py-3">{candidate.rank}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {candidate.history || 'Tidak ada riwayat'}
                </td>
                <td className="px-4 py-3 text-center">
                  {candidate.matchCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ScheduleRotation({
  groups,
  vessel: _vessel,
  type,
  part,
  job,
}: ScheduleProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [_selectedGroupVessels, _setSelectedGroupVessels] = useState<string[]>(
    []
  );

  const [crewToRelieve, setCrewToRelieve] = useState<CrewToRelieve[]>([]);
  const [replacementOptions, setReplacementOptions] = useState<
    ReplacementOption[]
  >([]);
  const [replacementInfo, setReplacementInfo] = useState<{
    nextGroup?: string;
  }>({});

  const [selectedReplacement, setSelectedReplacement] = useState<
    Record<string, ReplacementOption | null>
  >({});

  const [loading, setLoading] = useState(false);
  const [loadingReplacements, setLoadingReplacements] = useState(false);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🆕 State untuk tracking locked data
  const [lockedScheduleId, setLockedScheduleId] = useState<string | null>(null);
  const [isLockedFromDB, setIsLockedFromDB] = useState(false);
  const [isLoadingLocked, setIsLoadingLocked] = useState(false);

  // 🆕 State untuk tracking all locked rotations (untuk filtering)
  const [allLockedRotations, setAllLockedRotations] = useState<any[]>([]);

  // 🆕 State untuk tracking apakah current group sudah di-lock (seperti ContainerRotation)
  const [isCurrentGroupLocked, setIsCurrentGroupLocked] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const formatJobName = (jobName: string): string => {
    const jobMapping: Record<string, string> = {
      mualimII: 'MUALIM II',
      mualimIII: 'MUALIM III',
      masinisIII: 'MASINIS III',
      masinisIV: 'MASINIS IV',
      nakhoda: 'NAKHODA',
      mualimi: 'MUALIM I',
      kkm: 'KKM',
      masinis1: 'MASINIS I',
      masinis2: 'MASINIS II',
    };

    return jobMapping[jobName] || jobName.toUpperCase();
  };

  // 🆕 IMPROVED: Load data dengan urutan yang benar
  useEffect(() => {
    if (selectedGroup && job) {
      loadGroupData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, job]);

  const loadGroupData = async () => {
    // Skip jika data sudah di-load oleh useEffect (locked data)
    if (isCurrentGroupLocked) {
      console.log(
        '⏭️ Skipping loadGroupData - data already loaded from locked state'
      );
      return;
    }

    setIsLoadingLocked(true);
    setLoading(true);

    // Reset state untuk data baru
    setSelectedReplacement({});
    setCrewToRelieve([]);
    setReplacementOptions([]);
    setLocked(false);
    setIsLockedFromDB(false);
    setLockedScheduleId(null);

    await fetchCrewToRelieve();
    await fetchReplacementOptions();

    setIsLoadingLocked(false);
    setLoading(false);
  };

  const handleCardClick = (groupKey: string) => {
    // ✅ ALLOW switching groups even when one is locked
    // User can view other groups, just can't edit locked group
    setSelectedGroup(groupKey);
    _setSelectedGroupVessels(groups[groupKey] || []);

    // 🚫 DON'T reset selections here!
    // loadGroupData will handle loading locked data or resetting if unlocked
  };

  const fetchCrewToRelieve = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      const vessels = groups[selectedGroup] || [];
      const vesselQuery = vessels.join(',');

      const jobMapping: Record<string, string> = {
        mualimII: 'MUALIM II',
        mualimIII: 'MUALIM III',
        masinisIII: 'MASINIS III',
        masinisIV: 'MASINIS IV',
        nakhoda: 'NAKHODA',
        mualimi: 'MUALIM I',
        kkm: 'KKM',
        masinis1: 'MASINIS I',
        masinis2: 'MASINIS II',
      };
      const mappedJob = jobMapping[job] || job.toUpperCase();

      const response = await fetch(
        `${API_BASE_URL}/get_crew_to_relieve?vessel_group=${encodeURIComponent(
          vesselQuery
        )}&job=${mappedJob}&days_threshold=30&days_elapsed_threshold=335`
      );

      const result = await response.json();

      if (result.status === 'success') {
        setCrewToRelieve(result.data);
        console.log('✅ Crew to relieve loaded:', result.data.length);
      } else {
        console.error('Error:', result.message);
        alert('Gagal memuat data crew: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching crew to relieve:', error);
      alert('Terjadi kesalahan saat memuat data crew');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplacementOptions = async () => {
    if (!selectedGroup) return;

    setLoadingReplacements(true);
    try {
      const jobMapping: Record<string, string> = {
        mualimII: 'MUALIM II',
        mualimIII: 'MUALIM III',
        masinisIII: 'MASINIS III',
        masinisIV: 'MASINIS IV',
        nakhoda: 'NAKHODA',
        mualimi: 'MUALIM I',
        kkm: 'KKM',
        masinis1: 'MASINIS I',
        masinis2: 'MASINIS II',
      };
      const mappedJob = jobMapping[job] || job.toUpperCase();

      const groupKeys = Object.keys(groups);
      const currentGroupNum = parseInt(
        selectedGroup.replace('container_rotation', '')
      );

      let nextGroupVessels: string[] = [];
      let nextGroupKey = '';
      let promotionVessels: string[] = [];
      let promotionJob = '';

      const jobHierarchy: Record<string, string> = {
        'MUALIM II': 'MUALIM III',
        'MUALIM III': 'JURU MUDI',
        'MASINIS III': 'MASINIS IV',
        'MASINIS IV': 'JURU MINYAK',
      };

      if (currentGroupNum === 1) {
        const group2Key =
          groupKeys.find(k => k === 'container_rotation2') || '';
        const group3Key =
          groupKeys.find(k => k === 'container_rotation3') || '';

        nextGroupVessels = [
          ...(groups[group2Key] || []),
          ...(groups[group3Key] || []),
        ];
        nextGroupKey = `${group2Key},${group3Key}`;
      } else if (currentGroupNum === 2) {
        const group3Key =
          groupKeys.find(k => k === 'container_rotation3') || '';
        const group4Key =
          groupKeys.find(k => k === 'container_rotation4') || '';

        nextGroupVessels = [
          ...(groups[group3Key] || []),
          ...(groups[group4Key] || []),
        ];
        nextGroupKey = `${group3Key},${group4Key}`;
      } else if (currentGroupNum === 3) {
        const group4Key =
          groupKeys.find(k => k === 'container_rotation4') || '';
        const group1Key =
          groupKeys.find(k => k === 'container_rotation1') || '';

        const group4Vessels = [...(groups[group4Key] || [])];
        const lowerRankJob = jobHierarchy[mappedJob];
        if (lowerRankJob) {
          promotionJob = lowerRankJob;
          promotionVessels = [...(groups[group1Key] || [])];
          nextGroupVessels = [...group4Vessels, ...promotionVessels];
          nextGroupKey = `${group4Key},${group1Key}(${lowerRankJob})`;
        } else {
          nextGroupVessels = group4Vessels;
          nextGroupKey = group4Key;
        }
      } else if (currentGroupNum === 4) {
        const group1Key =
          groupKeys.find(k => k === 'container_rotation1') || '';
        const group2Key =
          groupKeys.find(k => k === 'container_rotation2') || '';

        const lowerRankJob = jobHierarchy[mappedJob];
        if (lowerRankJob) {
          promotionJob = lowerRankJob;
          promotionVessels = [
            ...(groups[group1Key] || []),
            ...(groups[group2Key] || []),
          ];
          nextGroupKey = `${group1Key},${group2Key}(${lowerRankJob})`;
          nextGroupVessels = [...promotionVessels];
        }
      }

      const vesselsQuery = nextGroupVessels.join(',');
      let apiUrl = `${API_BASE_URL}/get_available_replacements?job=${mappedJob}&vessel_group=${encodeURIComponent(
        selectedGroup
      )}&next_group=${encodeURIComponent(
        nextGroupKey
      )}&next_group_vessels=${encodeURIComponent(
        vesselsQuery
      )}&day_elapsed_threshold=0`;

      if (promotionJob && promotionVessels.length > 0) {
        const promotionVesselsQuery = promotionVessels.join(',');
        apiUrl += `&promotion_job=${encodeURIComponent(
          promotionJob
        )}&promotion_vessels=${encodeURIComponent(promotionVesselsQuery)}`;
      }

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.status === 'success') {
        setReplacementOptions(result.data);
        setReplacementInfo({
          nextGroup: nextGroupKey,
        });
        console.log('✅ Replacement options loaded:', {
          count: result.count,
        });
      } else {
        console.error('Error:', result.message);
        alert('Gagal memuat opsi pengganti: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching replacements:', error);
      alert('Terjadi kesalahan saat memuat opsi pengganti');
    } finally {
      setLoadingReplacements(false);
    }
  };

  // 🆕 Function to reload all locked rotations (useCallback untuk menghindari re-render)
  const reloadLockedRotations = useCallback(async () => {
    try {
      const jobMapping: Record<string, string> = {
        mualimII: 'MUALIM II',
        mualimIII: 'MUALIM III',
        masinisIII: 'MASINIS III',
        masinisIV: 'MASINIS IV',
        nakhoda: 'NAKHODA',
        mualimi: 'MUALIM I',
        kkm: 'KKM',
        masinis1: 'MASINIS I',
        masinis2: 'MASINIS II',
      };
      const mappedJob = jobMapping[job] || job.toUpperCase();

      const response = await fetch(
        `${API_BASE_URL}/locked_rotations?job=${mappedJob}`
      );
      const result = await response.json();

      if (result.status === 'success') {
        console.log(
          '🔄 Locked rotations fetched from API:',
          result.data.length
        );

        // DEBUG: Log first item to check data structure
        if (result.data.length > 0) {
          console.log('� Sample locked rotation data:', {
            group_key: result.data[0].group_key,
            job: result.data[0].job,
            crew_data_type: typeof result.data[0].crew_data,
            reliever_data_type: typeof result.data[0].reliever_data,
            reliever_data_sample: result.data[0].reliever_data,
          });
        }

        setAllLockedRotations(result.data);
      } else {
        setAllLockedRotations([]);
      }
    } catch (error) {
      console.error('❌ Error reloading locked rotations:', error);
      setAllLockedRotations([]);
    }
  }, [API_BASE_URL, job]);

  // 🆕 Load ALL locked rotations for this job (untuk filtering available replacements)
  useEffect(() => {
    reloadLockedRotations();
  }, [reloadLockedRotations]); // 🔥 FIXED: Removed 'locked' dependency to prevent infinite loop

  // 🆕 Check if current group is locked (seperti ContainerRotation)
  useEffect(() => {
    if (selectedGroup && allLockedRotations.length > 0) {
      const lockedData = allLockedRotations.find(
        lock => lock.group_key === selectedGroup && lock.is_active
      );
      setIsCurrentGroupLocked(!!lockedData);

      // Jika group sudah di-lock, LOAD data yang tersimpan
      if (lockedData) {
        console.log('📦 Loading locked data from memory:', lockedData);

        try {
          // Parse crew data and reliever data
          // Backend sudah parse JSON, jadi kalau masih string berarti error
          let crewData = lockedData.crew_data;
          let relieverData = lockedData.reliever_data;

          // Jika masih string (backend belum parse), parse manual
          if (typeof crewData === 'string') {
            crewData = JSON.parse(crewData);
          }
          if (typeof relieverData === 'string') {
            relieverData = JSON.parse(relieverData);
          }

          // Fallback jika null/undefined
          crewData = crewData || [];
          relieverData = relieverData || {};

          console.log('✅ Parsed locked data:', {
            crewData,
            relieverData,
          });

          // Set all state dengan data yang tersimpan
          setCrewToRelieve(crewData);
          setSelectedReplacement(relieverData);
          setLocked(true);
          setIsLockedFromDB(true);
          setLockedScheduleId(lockedData.id);

          console.log('✅ Locked data loaded:', {
            id: lockedData.id,
            group: selectedGroup,
            job: formatJobName(job),
            crewCount: crewData.length,
            replacementCount: Object.keys(relieverData).length,
            relieverData: relieverData,
          });
        } catch (error) {
          console.error('❌ Error parsing locked data:', error);
          console.error('Raw data:', {
            crew_data: lockedData.crew_data,
            reliever_data: lockedData.reliever_data,
          });

          // Clear locked state jika parse error
          setIsCurrentGroupLocked(false);
          setLocked(false);
          setIsLockedFromDB(false);
          setLockedScheduleId(null);

          alert(
            '⚠️ Error loading locked data. Data mungkin corrupt. Silakan unlock dan lock ulang.'
          );
        }
      } else {
        // Jika group TIDAK di-lock, CLEAR data dan fetch baru
        setLocked(false);
        setIsLockedFromDB(false);
        setLockedScheduleId(null);
        setCrewToRelieve([]);
        setSelectedReplacement({});
      }
    } else {
      setIsCurrentGroupLocked(false);
    }
  }, [selectedGroup, allLockedRotations, job]);

  // 🆕 IMPROVED: Check existing locked data dengan return value
  // 🆕 IMPROVED: handleReplacementChange dengan logging
  const handleReplacementChange = (
    crewCode: string,
    replacementCode: string
  ) => {
    if (!replacementCode) {
      // User memilih "Pilih Pengganti" (empty option)
      setSelectedReplacement(prev => ({
        ...prev,
        [crewCode]: null,
      }));
      return;
    }

    // 🔥 FIX: Compare both as strings to handle type mismatch
    const replacement = replacementOptions.find(
      r => String(r.seamancode) === String(replacementCode)
    );

    console.log('🔄 Replacement changed:', {
      crewCode,
      replacementCode,
      replacementCodeType: typeof replacementCode,
      foundReplacement: replacement,
      availableSeamancodes: replacementOptions.map(r => ({
        code: r.seamancode,
        type: typeof r.seamancode,
      })),
    });

    if (!replacement) {
      console.error('❌ Replacement not found!', {
        searchFor: replacementCode,
        availableOptions: replacementOptions.length,
      });
      return;
    }

    setSelectedReplacement(prev => {
      const newState = {
        ...prev,
        [crewCode]: replacement,
      };
      console.log('📊 New selectedReplacement state:', newState);
      return newState;
    });
  };

  // 🆕 IMPROVED: handleLockToggle dengan better error handling
  const handleLockToggle = async () => {
    if (locked) {
      // ==================== UNLOCK ====================
      if (confirm('Apakah Anda yakin ingin membuka kunci data?')) {
        setSubmitting(true);
        try {
          console.log('🔓 Unlocking:', {
            selectedGroup,
            job: formatJobName(job),
          });

          const response = await fetch(
            `${API_BASE_URL}/locked_rotations/${selectedGroup}?job=${formatJobName(
              job
            )}`,
            { method: 'DELETE' }
          );

          const result = await response.json();
          console.log('Unlock response:', result);

          if (result.status === 'success') {
            setLocked(false);
            setIsLockedFromDB(false);
            setLockedScheduleId(null);

            // Reload locked rotations untuk update status
            await reloadLockedRotations();

            // Refresh data
            await fetchCrewToRelieve();
            await fetchReplacementOptions();

            // Reset selections
            setSelectedReplacement({});
          } else {
            console.error('❌ Gagal unlock:', result.message);
          }
        } catch (error) {
          console.error('Error unlocking:', error);
        } finally {
          setSubmitting(false);
        }
      }
    } else {
      // ==================== LOCK ====================

      console.log('🔒 Lock validation start:', {
        crewToRelieveCount: crewToRelieve.length,
        selectedReplacementKeys: Object.keys(selectedReplacement),
        selectedReplacement: selectedReplacement,
      });

      // Validasi 1: Cek apakah ada crew yang perlu diganti
      if (crewToRelieve.length === 0) {
        console.warn('⚠️ Tidak ada crew yang perlu diganti');
        return;
      }

      // Validasi 2: Cek apakah semua crew sudah dipilih replacementnya
      const unassigned = crewToRelieve.filter(
        crew => !selectedReplacement[crew.seamancode]
      );

      console.log('⚠️ Unassigned crew:', unassigned);

      if (unassigned.length > 0) {
        console.warn(
          `⚠️ Masih ada ${unassigned.length} crew yang belum dipilih pengganti:`,
          unassigned.map(c => `${c.seamancode} - ${c.name}`)
        );
        return;
      }

      setSubmitting(true);
      try {
        const scheduleTable = crewToRelieve.map(crew => {
          const replacement = selectedReplacement[crew.seamancode];
          return {
            currentCrew: {
              seamancode: crew.seamancode,
              name: crew.name,
              vessel: crew.currentVessel,
              position: crew.currentPosition,
              daysRemaining: crew.daysRemaining,
              daysElapsed: crew.daysElapsed,
              endDate: crew.endDate,
            },
            replacement: replacement
              ? {
                  seamancode: replacement.seamancode,
                  name: replacement.name,
                  position: replacement.position,
                  lastVessel: replacement.lastVessel,
                  status: replacement.status,
                  daysSinceLastVessel: replacement.daysSinceLastVessel,
                }
              : null,
          };
        });

        const lockedSeamanCodes = Object.values(selectedReplacement)
          .filter(r => r !== null)
          .map(r => (r as ReplacementOption).seamancode);

        const payload = {
          groupKey: selectedGroup,
          job: formatJobName(job),
          scheduleTable: scheduleTable,
          nahkodaTable: crewToRelieve,
          daratTable: selectedReplacement,
          lockedSeamanCodes: lockedSeamanCodes,
          lockedBy: 'CURRENT_USER', // TODO: Ganti dengan user ID dari session/auth
        };

        console.log('📤 Sending lock data:', payload);

        const response = await fetch(`${API_BASE_URL}/locked_rotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log('Lock response:', result);

        if (result.status === 'success') {
          setLocked(true);
          setIsLockedFromDB(true);
          setLockedScheduleId(result.id);

          // Reload locked rotations untuk update status
          await reloadLockedRotations();

          console.log(
            `✅ Data berhasil dikunci dan disimpan! ID: ${result.id}`
          );
        } else {
          console.error('❌ Gagal lock:', result.message);
        }
      } catch (error) {
        console.error('Error locking:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 🆕 Locked Status Info - Seperti ContainerRotation */}
      {selectedGroup && isCurrentGroupLocked && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiLockClosed className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Rotasi untuk Group{' '}
              {selectedGroup.replace('container_rotation', '')} -{' '}
              {formatJobName(job)} sudah di-lock
            </span>
          </div>
        </div>
      )}

      {/* ================== GRID CARD ================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => {
          // Check if this group is locked
          const isGroupLocked = allLockedRotations.some(
            lock => lock.group_key === groupKey && lock.is_active
          );

          return (
            <div key={groupKey} className="relative">
              {/* Lock icon di pojok kanan atas card - seperti ContainerRotation */}
              {isGroupLocked && (
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

      {/* ================== TABLES ================== */}
      {selectedGroup ? (
        <>
          {loading || isLoadingLocked ? (
            <div className="flex flex-col justify-center items-center mt-6">
              <Spinner color="info" size="xl" />
              <span className="mt-2 text-gray-700">
                {isLoadingLocked
                  ? 'Checking locked data...'
                  : 'Loading data...'}
              </span>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* ================== KRU AKAN TURUN ================== */}
                <div className="lg:col-span-2 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                  <div className="flex items-center justify-between mb-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <HiUserRemove className="h-5 w-5 text-red-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        [PERLU] ROTASI KAPAL {formatJobName(job)}
                      </h2>
                    </div>
                    <span className="text-sm text-gray-500">
                      Group: {selectedGroup?.replace('container_rotation', '')}
                    </span>
                  </div>

                  {crewToRelieve.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada crew yang perlu diganti dalam 30 hari ke depan
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-700">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 w-[240px]">
                              {formatJobName(job)} saat ini
                            </th>
                            <th className="px-4 py-3 w-[140px]">Vessel</th>
                            <th className="px-4 py-3 w-[100px]">Sisa Hari</th>
                            <th className="px-4 py-3 w-[100px]">Hari Kerja</th>
                            <th className="px-4 py-3 w-[240px]">Pengganti</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crewToRelieve.map((crew, index) => {
                            const replacement =
                              selectedReplacement[crew.seamancode];
                            const isAssigned = !!replacement;

                            // 🐛 DEBUG: Log lock status per row
                            if (index === 0) {
                              console.log('🔐 Lock Status Check:', {
                                locked,
                                isLockedFromDB,
                                lockedScheduleId,
                                crewCode: crew.seamancode,
                                hasReplacement: isAssigned,
                                replacement,
                              });
                            }

                            return (
                              <tr
                                key={index}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {crew.seamancode} - {crew.name}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {crew.currentVessel}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`rounded px-2 py-1 text-xs text-center font-semibold ${
                                      crew.daysElapsed > 365
                                        ? 'bg-red-100 text-red-800'
                                        : crew.daysRemaining < 7
                                          ? 'bg-red-100 text-red-800'
                                          : crew.daysRemaining < 30
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {crew.daysElapsed > 365
                                      ? `+ ${crew.daysElapsed - 365} hari`
                                      : `- ${365 - crew.daysElapsed} hari`}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-medium text-gray-700">
                                    {crew.daysElapsed} hari
                                  </span>
                                </td>
                                {/* 🆕 KOLOM PENGGANTI - FIXED */}
                                <td className="px-4 py-3">
                                  {locked ? (
                                    // Kondisi 1: Data LOCKED - Tampilkan read-only
                                    <div className="flex items-center gap-2">
                                      {isAssigned ? (
                                        <>
                                          <span className="font-medium text-gray-900">
                                            {replacement!.seamancode} -{' '}
                                            {replacement!.name}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-red-600">
                                          Belum dipilih
                                        </span>
                                      )}
                                    </div>
                                  ) : isAssigned ? (
                                    // Kondisi 2: UNLOCKED & sudah ada replacement - Tampilkan dengan tombol X
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {replacement!.seamancode} -{' '}
                                        {replacement!.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          setSelectedReplacement(prev => ({
                                            ...prev,
                                            [crew.seamancode]: null,
                                          }))
                                        }
                                        className="text-xs text-red-600 hover:text-red-800"
                                        title="Hapus pilihan"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    // Kondisi 3: UNLOCKED & belum ada replacement - Tampilkan dropdown
                                    <select
                                      className="rounded border-gray-300 text-sm w-full"
                                      value=""
                                      onChange={e =>
                                        handleReplacementChange(
                                          crew.seamancode,
                                          e.target.value
                                        )
                                      }
                                      disabled={loadingReplacements}
                                    >
                                      <option value="">
                                        {loadingReplacements
                                          ? 'Loading...'
                                          : 'Pilih Pengganti'}
                                      </option>
                                      {replacementOptions
                                        .filter(opt => {
                                          // 🔥 Filter out seamen yang sudah di-lock di group lain
                                          const lockedRelieverCodes =
                                            allLockedRotations
                                              .filter(
                                                lock =>
                                                  lock.group_key !==
                                                    selectedGroup && // Exclude current group
                                                  lock.is_active
                                              )
                                              .flatMap(lock => {
                                                try {
                                                  const relieverData =
                                                    JSON.parse(
                                                      lock.reliever_data || '{}'
                                                    );
                                                  return Object.values(
                                                    relieverData
                                                  )
                                                    .filter(r => r !== null)
                                                    .map((r: any) =>
                                                      String(r.seamancode)
                                                    );
                                                } catch {
                                                  return [];
                                                }
                                              });

                                          return !lockedRelieverCodes.includes(
                                            String(opt.seamancode)
                                          );
                                        })
                                        .map(opt => (
                                          <option
                                            key={opt.seamancode}
                                            value={opt.seamancode}
                                          >
                                            {opt.seamancode} - {opt.name} (
                                            {opt.status})
                                          </option>
                                        ))}
                                    </select>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ================== OPSI CREW ================== */}
                <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                  <div className="flex flex-col gap-2 mb-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <HiSwitchHorizontal className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        OPSI PENGGANTI
                      </h2>
                    </div>
                  </div>

                  {loadingReplacements ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner />
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  ) : replacementOptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada crew pengganti tersedia
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500 table-fixed">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                          <tr>
                            <th className="px-4 py-3 w-[200px]">Seamen</th>
                            <th className="px-4 py-3 w-[140px] text-center">
                              Last Location
                            </th>
                            <th className="px-4 py-3 w-[120px] text-center">
                              Hari Kerja
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {replacementOptions
                            .filter(replacement => {
                              // 🔥 Filter out seamen yang sudah di-lock di group lain
                              const lockedRelieverCodes = allLockedRotations
                                .filter(
                                  lock =>
                                    lock.group_key !== selectedGroup && // Exclude current group
                                    lock.is_active
                                )
                                .flatMap(lock => {
                                  try {
                                    const relieverData = JSON.parse(
                                      lock.reliever_data || '{}'
                                    );
                                    return Object.values(relieverData)
                                      .filter(r => r !== null)
                                      .map((r: any) => String(r.seamancode));
                                  } catch {
                                    return [];
                                  }
                                });

                              const isLockedElsewhere =
                                lockedRelieverCodes.includes(
                                  String(replacement.seamancode)
                                );

                              return !isLockedElsewhere;
                            })
                            .map((replacement, index) => {
                              const isSelected = Object.values(
                                selectedReplacement
                              ).some(
                                sel =>
                                  (sel as ReplacementOption | null)
                                    ?.seamancode === replacement.seamancode
                              );

                              return (
                                <tr
                                  key={index}
                                  className={`border-b hover:bg-gray-50 ${
                                    isSelected ? 'bg-green-50' : ''
                                  }`}
                                >
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">
                                        {replacement.seamancode} -{' '}
                                        {replacement.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-center">
                                    {replacement.lastVessel}
                                  </td>
                                  <td className="px-4 py-3 text-xs font-medium text-gray-700 text-center">
                                    {replacement.daysSinceLastVessel} hari
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* ================== POTENSIAL PROMOSI (GROUP 3 & 4 ONLY) ================== */}
              {(selectedGroup === 'container_rotation3' ||
                selectedGroup === 'container_rotation4') && (
                <PromotionCandidatesTable job={job} />
              )}

              {/* ================== ACTION BUTTONS ================== */}
              {crewToRelieve.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button
                      color={locked ? 'gray' : 'blue'}
                      onClick={handleLockToggle}
                      disabled={submitting || loading || loadingReplacements}
                      className="flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Spinner size="mr-2 sm" />
                          {locked ? 'Unlocking...' : 'Locking...'}
                        </>
                      ) : locked ? (
                        <>
                          <HiLockOpen className="mr-2 h-5 w-5" />
                          Unlock Data
                        </>
                      ) : (
                        <>
                          <HiLockClosed className="mr-2 h-5 w-5" />
                          Lock Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
