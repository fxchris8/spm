// src/hooks/useSeniorRotation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface GroupDataResponse {
  schedule?: TableJson;
  nahkoda?: TableJson;
  darat?: TableJson | null;
  error?: string;
}

interface LockedRotation {
  groupKey: string;
  job: string;
  scheduleTable: TableJson;
  nahkodaTable: TableJson;
  daratTable: TableJson | null;
  lockedSeamanCodes: string[];
  lockedCadanganCodes: string[];
  lockedRelieverCodes: string[];
  lockedAt: string;
}

// ============= FETCH FUNCTIONS =============

// Fetch locked rotations for a specific job
async function fetchLockedRotations(
  job: string
): Promise<Record<string, LockedRotation>> {
  const response = await fetch(`${API_BASE_URL}/locked-rotations?job=${job}`);
  const data = await response.json();

  if (data.status === 'success') {
    const locksMap: Record<string, LockedRotation> = {};

    data.data.forEach((item: any) => {
      const allLockedCodes = item.locked_seaman_codes || [];
      const nahkodaData = item.crew_data?.data || [];
      const daratData = item.reliever_data?.data || [];

      const cadanganCodes = nahkodaData
        .map((row: any) => {
          const code = String(
            row.seamancode ||
              row.SEAMANCODE ||
              row.Seamancode ||
              row.SeamanCode ||
              row.seaman_code ||
              row.SEAMAN_CODE ||
              ''
          ).trim();
          return code;
        })
        .filter((code: string) => code !== '');

      const relieverCodes = daratData
        .map((row: any) => {
          const code = String(
            row.seamancode ||
              row.SEAMANCODE ||
              row.Seamancode ||
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

    return locksMap;
  }

  return {};
}

// Fetch cadangan data for a specific group
async function fetchCadanganData(
  job: string,
  groupKey: string,
  lockedCadanganCodes: string[]
): Promise<any[]> {
  // Build query params
  const params = new URLSearchParams();
  if (lockedCadanganCodes.length > 0) {
    params.append('locked_codes', lockedCadanganCodes.join(','));
  }

  const url = `${API_BASE_URL}/cadangan-${job}${
    params.toString() ? `?${params.toString()}` : ''
  }`;
  console.log('🔍 Fetching cadangan data:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cadangan data');
  }

  const data = await response.json();
  console.log('🔍 Cadangan response:', data);

  // ✅ PERBAIKAN: Data sudah dalam format array langsung
  return Array.isArray(data) ? data : [];
}

// Fetch promotion candidates
async function fetchPromotionCandidates(
  job: string,
  groupKey: string,
  lockedCadanganCodes: string[]
): Promise<any[]> {
  const params = new URLSearchParams();
  if (lockedCadanganCodes.length > 0) {
    params.append('locked_codes', lockedCadanganCodes.join(','));
  }

  if (job === 'KKM') {
    job = job.toLowerCase(); // sekarang job === "kkm"
  }

  const url = `${API_BASE_URL}/seamen/promotion-candidates-${job}${
    params.toString() ? `?${params.toString()}` : ''
  }`;
  console.log('🔍 Fetching promotion candidates:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch promotion candidates');
  }

  const result = await response.json();
  console.log('🔍 Promotion candidates response:', result);

  // ✅ PERBAIKAN: Ambil dari result.data dan mapping field 'code' ke 'seamancode'
  const rawData = result.data || [];
  return rawData.map((item: any) => ({
    ...item,
    seamancode: item.code || item.seamancode, // Map 'code' to 'seamancode'
  }));
}

// Generate schedule
async function generateSchedule(payload: {
  vessel: string;
  type: string;
  job: string;
  groupKey: string;
  kapal: string[];
  standby: string[];
  darat: string[];
  part: string;
}): Promise<GroupDataResponse> {
  // Buat selected_group digabung dengan vessel
  console.log('Generating schedule with payload:', payload);
  const mappedGroup = payload.groupKey.replace(
    'container_rotation',
    payload.vessel
  );

  const formattedJob = payload.job.toUpperCase();

  const finalPayload = {
    selected_group: mappedGroup,
    cadangan: payload.standby,
    cadangan2: payload.darat,
    type: payload.type,
    part: payload.part,
  };

  const response = await fetch(
    `${API_BASE_URL}/container-rotation?job=${formattedJob}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    }
  );
  console.log('payload generateSchedule:', finalPayload);

  if (!response.ok) {
    throw new Error('Failed to generate schedule');
  }

  return response.json();
}

// Lock rotation
async function lockRotation(payload: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/locked-rotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to lock rotation');
  }

  return response.json();
}

// Unlock rotation
async function unlockRotation(groupKey: string, job: string): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/locked-rotations/${groupKey}?job=${job}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupKey, job }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to unlock rotation');
  }

  return response.json();
}

// ============= CUSTOM HOOKS =============

// Hook untuk locked rotations (load once per job)
export function useLockedRotations(job: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['locked-rotations', job],
    queryFn: () => fetchLockedRotations(job),
    staleTime: 5 * 60 * 1000, // Fresh 5 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  return {
    lockedRotations: data || {},
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk mutasi data (lazy load per group)
export function useMutasiData(
  job: string,
  type: 'senior' | 'junior' | 'manalagi' | null,
  groupKey: string | null,
  groups: Record<string, string[]>,
  lockedCadanganCodes: string[],
  enabled: boolean = true
) {
  // ✅ DEFINISI KAPAL GROUPS
  const CONTAINER_VESSELS = new Set([
    'KM. ORIENTAL EMERALD',
    'KM. ORIENTAL RUBY',
    'KM. ORIENTAL SILVER',
    'KM. ORIENTAL GOLD',
    'KM. ORIENTAL JADE',
    'KM. ARMADA SEJATI',
    'KM. ORIENTAL DIAMOND',
    'KM. LUZON',
    'KM. BALI AYU',
    'KM. VERIZON',
    'KM. ORIENTAL GALAXY',
    'KM. HIJAU SAMUDRA',
    'KM. ARMADA PERMATA',
    'KM. ORIENTAL SAMUDERA',
    'KM. ORIENTAL PACIFIC',
    'KM. PULAU NUNUKAN',
    'KM. TELUK FLAMINGGO',
    'KM. TELUK BERAU',
    'KM. TELUK BINTUNI',
    'KM. PULAU LAYANG',
    'KM. PULAU WETAR',
    'KM. PULAU HOKI',
    'KM. SPIL HANA',
    'KM. SPIL HASYA',
    'KM. SPIL HAPSRI',
    'KM. SPIL HAYU',
    'KM. HIJAU JELITA',
    'KM. HIJAU SEJUK',
    'KM. ARMADA SERASI',
    'KM. ARMADA SEGARA',
    'KM. ARMADA SENADA',
    'KM. HIJAU SEGAR',
    'KM. TITANIUM',
    'KM. VERTIKAL',
    'KM. SPIL RENATA',
    'KM. SPIL RATNA',
    'KM. SPIL RUMI',
    'KM. PEKAN BERAU',
    'KM. SPIL RAHAYU',
    'KM. SPIL RETNO',
    'KM. MINAS BARU',
    'KM. PEKAN SAMPIT',
    'KM. SELILI BARU',
    'KM. DERAJAT',
    'KM. MULIANIM',
    'KM. PRATIWI RAYA',
    'KM. MAGELLAN',
    'KM. PAHALA',
    'KM. PEKAN RIAU',
    'KM. PEKAN FAJAR',
    'KM. FORTUNE',
    'KM. PRATIWI SATU',
    'KM. BALI GIANYAR',
    'KM. BALI KUTA',
    'KM. BALI SANUR',
    'KM. AKASHIA',
    'KM. KAPPA',
  ]);

  const MANALAGI_VESSELS = new Set([
    'KM. MANALAGI ASTA',
    'KM. MANALAGI ASTI',
    'KM. MANALAGI DASA',
    'KM. MANALAGI ENZI',
    'KM. MANALAGI HITA',
    'KM. MANALAGI SAMBA',
    'KM. MANALAGI TARA',
    'KM. MANALAGI TISYA',
    'KM. MANALAGI VIRA',
    'KM. MANALAGI WANDA',
    'KM. MANALAGI YASA',
    'KM. XYS SATU',
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['mutasi-data', job, type, groupKey, lockedCadanganCodes],
    queryFn: async () => {
      if (!groupKey || !type) return [];

      const formattedJob = job.toUpperCase();
      const params = new URLSearchParams({ job: formattedJob });

      if (lockedCadanganCodes.length > 0) {
        params.append('locked_codes', lockedCadanganCodes.join(','));
      }

      const response = await fetch(
        `${API_BASE_URL}/mutasi_filtered?${params.toString()}`
      );
      const result = await response.json();
      console.log('🔍 Mutasi API response:', result);

      if (result.status === 'success' && result.data) {
        const rawDataObject = result.data;
        const groupShips = groups[groupKey] || [];

        const rows = Object.entries(rawDataObject)
          .map(([seamancode, info]: [string, any]) => {
            const vlist = info?.vessels || [];

            // ✅ FILTER BERDASARKAN LAST VESSEL
            if (vlist.length > 0) {
              const lastVessel = vlist[vlist.length - 1]; // Vessel terakhir di array

              if (type === 'senior' || type === 'junior') {
                // Untuk container: SKIP jika last vessel adalah manalagi
                if (MANALAGI_VESSELS.has(lastVessel)) {
                  console.log(
                    `❌ Skipping ${seamancode} - last vessel: ${lastVessel} (Manalagi)`
                  );
                  return null; // Skip seaman ini
                }
              } else if (type === 'manalagi') {
                // Untuk manalagi: SKIP jika last vessel adalah container
                if (CONTAINER_VESSELS.has(lastVessel)) {
                  console.log(
                    `❌ Skipping ${seamancode} - last vessel: ${lastVessel} (Container)`
                  );
                  return null; // Skip seaman ini
                }
              }
            }

            const matchCount = vlist.filter((v: string) =>
              groupShips.some(gs => v.includes(gs))
            ).length;

            return {
              seamancode: seamancode,
              name: info?.name || '',
              vessels: vlist.join(', '),
              matchCount,
            };
          })
          .filter(row => row !== null) // ✅ Remove null entries
          .sort((a: any, b: any) => b.matchCount - a.matchCount)
          .slice(0, 50);

        console.log('🔍 Processed mutasi rows:', rows);
        console.log(`✅ Final count after filtering: ${rows.length}`);
        return rows;
      }
      return [];
    },
    enabled: enabled && !!groupKey && !!type,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    mutasiData: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk potential promotion (lazy load per group)
export function usePotentialPromotion(
  job: string,
  groupKey: string | null,
  groups: Record<string, string[]>,
  enabled: boolean = true
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['potential-promotion', job, groupKey],
    queryFn: async () => {
      if (!groupKey) return [];

      const groupShips = groups[groupKey] || [];
      const queryParams = groupShips
        .map(g => `group=${encodeURIComponent(g)}`)
        .join('&');
      const historyUrl = `${API_BASE_URL}/filter_history?${queryParams}`;

      const getPromotionEndpoint = (job: string): string => {
        const endpoints: Record<string, string> = {
          nakhoda: `${API_BASE_URL}/seamen/promotion-candidates-nakhoda`,
          KKM: `${API_BASE_URL}/seamen/promotion-candidates-kkm`,
          mualimI: `${API_BASE_URL}/seamen/promotion-candidates-mualimI`,
          masinisII: `${API_BASE_URL}/seamen/promotion-candidates-masinisII`,
        };
        return (
          endpoints[job] ||
          `${API_BASE_URL}/seamen/promotion-candidates-nakhoda`
        );
      };
      const candidateUrl = getPromotionEndpoint(job);

      const getCode = (x: any) =>
        String(
          x?.seamancode ?? x?.code ?? x?.seaman_code ?? x?.seamanCode ?? ''
        ).trim();

      const getPromotionSourceJob = (targetJob: string): string | null => {
        const normalized = targetJob.trim().toUpperCase();
        switch (normalized) {
          case 'NAKHODA':
            return 'MUALIMI';
          case 'KKM':
            return 'MASINISII';
          case 'MUALIMI':
            return 'MUALIMII';
          case 'MASINISII':
            return 'MASINISIII';
          default:
            return null;
        }
      };

      const normalizeJob = (str?: string) =>
        str ? str.toUpperCase().replace(/\s+/g, '').trim() : '';

      const sourceJob = getPromotionSourceJob(job);

      const fetchLockedSourceJob = async (): Promise<string[]> => {
        if (!sourceJob) return [];
        try {
          const res = await fetch(
            `${API_BASE_URL}/locked-rotations?job=${sourceJob}`
          );
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            return Object.values(data.data)
              .filter(
                (lock: any) =>
                  normalizeJob(lock.job) === normalizeJob(sourceJob)
              )
              .flatMap((lock: any) => {
                const raw =
                  lock.locked_seaman_codes ?? lock.lockedCadanganCodes ?? [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') {
                  try {
                    const parsed = JSON.parse(raw);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch {
                    return [];
                  }
                }
                return [];
              });
          }
          return [];
        } catch (err) {
          console.error('Gagal fetch locked source job:', err);
          return [];
        }
      };

      const [hist, cand, lockedCodes] = await Promise.all([
        fetch(historyUrl).then(r => r.json()),
        fetch(candidateUrl).then(r => r.json()),
        fetchLockedSourceJob(),
      ]);

      console.log('🔍 Filter history response:', hist);
      console.log('🔍 Promotion candidates response:', cand);

      // ✅ PERBAIKAN: Handle format response yang benar
      const histRowsRaw = hist?.data || [];
      const candRowsRaw = cand?.data || [];

      const allowed = new Set(candRowsRaw.map((item: any) => getCode(item)));

      const rows = histRowsRaw
        .map((item: any) => ({
          seamancode: getCode(item),
          name: item?.name,
          history: item?.history,
          matchCount: item?.matchCount ?? 0,
        }))
        .filter(
          (r: any) =>
            r.seamancode &&
            allowed.has(r.seamancode) &&
            !lockedCodes.includes(r.seamancode)
        )
        .sort((a: any, b: any) => (b.matchCount ?? 0) - (a.matchCount ?? 0))
        .slice(0, 50);

      console.log('🔍 Processed potential promotion rows:', rows);
      return rows;
    },
    enabled: enabled && !!groupKey,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    potentialData: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk cadangan data (lazy load per group)
export function useCadanganData(
  job: string,
  groupKey: string | null,
  lockedCadanganCodes: string[],
  enabled: boolean = true
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cadangan-data', job, groupKey, lockedCadanganCodes],
    queryFn: () => fetchCadanganData(job, groupKey!, lockedCadanganCodes),
    enabled: enabled && !!groupKey, // Only fetch when group is selected
    staleTime: 10 * 60 * 1000, // Fresh 10 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  return {
    cadanganData: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk promotion candidates (lazy load per group)
export function usePromotionCandidates(
  job: string,
  groupKey: string | null,
  lockedCadanganCodes: string[],
  enabled: boolean = true
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['promotion-candidates', job, groupKey, lockedCadanganCodes],
    queryFn: () =>
      fetchPromotionCandidates(job, groupKey!, lockedCadanganCodes),
    enabled: enabled && !!groupKey, // Only fetch when group is selected
    staleTime: 10 * 60 * 1000, // Fresh 10 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  return {
    promotionCandidates: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk generate schedule (mutation)
export function useGenerateSchedule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: generateSchedule,
    onSuccess: () => {
      // Optionally invalidate queries if needed
    },
  });

  return {
    generateSchedule: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}

// Hook untuk lock/unlock rotation (mutations)
export function useLockRotation() {
  const queryClient = useQueryClient();

  const lockMutation = useMutation({
    mutationFn: lockRotation,
    onSuccess: (_, variables) => {
      // Invalidate locked rotations query
      queryClient.invalidateQueries({
        queryKey: ['locked-rotations', variables.job],
      });
      // ✅ PERBAIKAN: Invalidate semua data related
      queryClient.invalidateQueries({
        queryKey: ['cadangan-data', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['promotion-candidates', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['mutasi-data', variables.job],
      });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: ({ groupKey, job }: { groupKey: string; job: string }) =>
      unlockRotation(groupKey, job),
    onSuccess: (_, variables) => {
      // Invalidate locked rotations query
      queryClient.invalidateQueries({
        queryKey: ['locked-rotations', variables.job],
      });
      // ✅ PERBAIKAN: Invalidate semua data untuk group ini
      queryClient.invalidateQueries({
        queryKey: ['cadangan-data', variables.job, variables.groupKey],
      });
      queryClient.invalidateQueries({
        queryKey: ['promotion-candidates', variables.job, variables.groupKey],
      });
      queryClient.invalidateQueries({
        queryKey: ['mutasi-data', variables.job, variables.groupKey],
      });
      // ✅ PERBAIKAN: Invalidate potential promotion karena locked codes berubah
      queryClient.invalidateQueries({
        queryKey: ['potential-promotion', variables.job],
      });
    },
  });

  return {
    lockRotation: lockMutation.mutateAsync,
    unlockRotation: unlockMutation.mutateAsync,
    lockLoading: lockMutation.isPending,
    unlockLoading: unlockMutation.isPending,
    error: lockMutation.error?.message || unlockMutation.error?.message || null,
  };
}
