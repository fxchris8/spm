// src/hooks/useBargeCraneRotation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVesselCategories } from './useVesselCategories';

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

// Fetch cadangan data for a specific group
async function fetchCadanganData(
  job: string,
  _groupKey: string,
  lockedCadanganCodes: string[],
  forecastMonth: number = 1,
  categorization?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (lockedCadanganCodes.length > 0) {
    params.append('locked_codes', lockedCadanganCodes.join(','));
  }
  if (forecastMonth !== 1) {
    params.append('forecast_month', String(forecastMonth));
  }
  if (categorization) {
    params.append('categorization', categorization);
  }

  const url = `${API_BASE_URL}/cadangan-${job}${params.toString() ? `?${params.toString()}` : ''
    }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cadangan data');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// Fetch promotion candidates
async function fetchPromotionCandidates(
  job: string,
  _groupKey: string,
  lockedCadanganCodes: string[],
  forecastMonth: number = 1,
  categorization?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (lockedCadanganCodes.length > 0) {
    params.append('locked_codes', lockedCadanganCodes.join(','));
  }
  if (forecastMonth !== 1) {
    params.append('forecast_month', String(forecastMonth));
  }
  if (categorization) {
    params.append('categorization', categorization);
  }

  if (job === 'KKM') {
    job = job.toLowerCase();
  }

  const url = `${API_BASE_URL}/seamen/promotion-candidates-${job}${params.toString() ? `?${params.toString()}` : ''
    }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch promotion candidates');
  }

  const result = await response.json();
  const rawData = result.data || [];
  return rawData.map((item: any) => ({
    ...item,
    seamancode: item.code || item.seamancode,
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
  categorization?: string; // bc
  forecastMonth?: number;
}): Promise<GroupDataResponse> {
  // Map bc_rotation group key to vessel name for backend
  const mappedGroup = payload.groupKey.replace('bc_rotation', payload.vessel);

  const formattedJob = payload.job.toUpperCase();

  const finalPayload = {
    selected_group: mappedGroup,
    kapal: payload.kapal,
    cadangan: payload.standby,
    cadangan2: payload.darat,
    type: payload.type,
    part: payload.part,
    categorization: payload.categorization,
    forecast_month: payload.forecastMonth ?? 1,
  };

  const response = await fetch(
    `${API_BASE_URL}/container-rotation?job=${formattedJob}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || 'Failed to generate schedule'
    );
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
async function unlockRotation(
  groupKey: string,
  job: string,
  vessel: string,
  forecastMonth: number = 1
): Promise<any> {
  const params = new URLSearchParams({ job, vessel });
  if (forecastMonth !== 1)
    params.append('forecast_month', String(forecastMonth));

  const response = await fetch(
    `${API_BASE_URL}/locked-rotations/${groupKey}?${params.toString()}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to unlock rotation');
  }

  return response.json();
}

// ============= CUSTOM HOOKS =============

// Hook untuk locked rotations (load once per job and vessel)
export function useLockedRotations(
  job: string,
  vessel: string,
  forecastMonth: number = 1
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bc', 'locked-rotations', job, vessel, forecastMonth],
    queryFn: async () => {
      const params = new URLSearchParams({ job, vessel });
      if (forecastMonth !== 1)
        params.append('forecast_month', String(forecastMonth));
      const response = await fetch(
        `${API_BASE_URL}/locked-rotations?${params.toString()}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        const locksMap: Record<string, LockedRotation> = {};
        data.data.forEach((item: any) => {
          const allLockedCodes = item.locked_seaman_codes || [];
          const nahkodaData = item.crew_data?.data || [];
          const daratData = item.reliever_data?.data || [];

          const cadanganCodes = nahkodaData
            .map((row: any) =>
              String(
                row.seamancode ||
                row.SEAMANCODE ||
                row.Seamancode ||
                row.SeamanCode ||
                row.seaman_code ||
                row.SEAMAN_CODE ||
                ''
              ).trim()
            )
            .filter((code: string) => code !== '');

          const relieverCodes = daratData
            .map((row: any) =>
              String(
                row.seamancode ||
                row.SEAMANCODE ||
                row.Seamancode ||
                row.SeamanCode ||
                row.seaman_code ||
                row.SEAMAN_CODE ||
                ''
              ).trim()
            )
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
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
  type: 'senior' | 'junior' | 'manalagi' | 'bc' | null,
  groupKey: string | null,
  groups: Record<string, string[]>,
  lockedCadanganCodes: string[],
  enabled: boolean = true,
  forecastMonth: number = 1
) {
  const { bcVessels } = useVesselCategories();
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'bc',
      'mutasi-data',
      job,
      groupKey,
      lockedCadanganCodes,
      forecastMonth,
    ],
    queryFn: async () => {
      if (!groupKey) return [];

      const formattedJob = job.toUpperCase();
      const params = new URLSearchParams({ job: formattedJob });

      if (lockedCadanganCodes.length > 0) {
        params.append('locked_codes', lockedCadanganCodes.join(','));
      }
      if (forecastMonth !== 1) {
        params.append('forecast_month', String(forecastMonth));
      }

      const response = await fetch(
        `${API_BASE_URL}/mutasi_filtered?${params.toString()}`
      );
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const rawDataObject = result.data;
        const groupShips = groups[groupKey] || [];

        const rows = Object.entries(rawDataObject)
          .map(([seamancode, info]: [string, any]) => {
            const vlist = info?.vessels || [];

            // Skip seaman based on last vessel category
            if (vlist.length > 0) {

              if (type === 'bc') {
                // BC requires at least 1 history entry in a BC vessel
                const hasBCHistory = vlist.some((v: string) =>
                  bcVessels.has(v)
                );
                if (!hasBCHistory) {
                  return null;
                }
              }
            }

            const matchCount = vlist.filter((v: string) =>
              groupShips.some(gs => v.includes(gs))
            ).length;

            return {
              seamancode: seamancode,
              last_location: info?.last_location || '',
              name: info?.name || '',
              vessels: vlist.join(', '),
              matchCount,
            };
          })
          .filter(row => row !== null)
          .sort((a: any, b: any) => b.matchCount - a.matchCount)
          .slice(0, 50);

        console.log(`✅ [BC] Processed mutasi rows: ${rows.length} seamen`);
        return rows;
      }
      return [];
    },
    enabled: enabled && !!groupKey,
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
  enabled: boolean = true,
  forecastMonth: number = 1
) {
  const { bcVessels } = useVesselCategories();
  const { data, isLoading, error } = useQuery({
    queryKey: ['bc', 'potential-promotion', job, groupKey, forecastMonth],
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

      const histRowsRaw = hist?.data || [];
      const candRowsRaw = cand?.data || [];

      const allowed = new Set(candRowsRaw.map((item: any) => getCode(item)));

      const rows = histRowsRaw
        .map((item: any) => ({
          seamancode: getCode(item),
          name: item?.name,
          history: item?.history,
          last_location: item?.last_location,
          matchCount: item?.matchCount ?? 0,
        }))
        .filter(
          (r: any) =>
            r.seamancode &&
            allowed.has(r.seamancode) &&
            !lockedCodes.includes(r.seamancode) &&
            // ✅ BC FILTER: Must have at least 1 history entry in a BC vessel
            Array.from(bcVessels).some((v: string) =>
              String(r.history || '').includes(v)
            )
        )
        .sort((a: any, b: any) => (b.matchCount ?? 0) - (a.matchCount ?? 0))
        .slice(0, 50);

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
  enabled: boolean = true,
  forecastMonth: number = 1,
  categorization?: string
) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'bc',
      'cadangan-data',
      job,
      groupKey,
      lockedCadanganCodes,
      forecastMonth,
      categorization,
    ],
    queryFn: () =>
      fetchCadanganData(
        job,
        groupKey!,
        lockedCadanganCodes,
        forecastMonth,
        categorization
      ),
    enabled: enabled && !!groupKey,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
  enabled: boolean = true,
  forecastMonth: number = 1,
  categorization?: string
) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'bc',
      'promotion-candidates',
      job,
      groupKey,
      lockedCadanganCodes,
      forecastMonth,
      categorization,
    ],
    queryFn: () =>
      fetchPromotionCandidates(
        job,
        groupKey!,
        lockedCadanganCodes,
        forecastMonth,
        categorization
      ),
    enabled: enabled && !!groupKey,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    promotionCandidates: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk generate schedule (mutation)
export function useGenerateSchedule() {
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
      queryClient.invalidateQueries({
        queryKey: ['bc', 'locked-rotations', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'cadangan-data', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'promotion-candidates', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'mutasi-data', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'job-submitted'],
      });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: ({
      groupKey,
      job,
      vessel,
      forecastMonth = 1,
    }: {
      groupKey: string;
      job: string;
      vessel: string;
      forecastMonth?: number;
    }) => unlockRotation(groupKey, job, vessel, forecastMonth),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'bc',
          'locked-rotations',
          variables.job,
          variables.vessel,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          'bc',
          'cadangan-data',
          variables.job,
          variables.groupKey,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          'bc',
          'promotion-candidates',
          variables.job,
          variables.groupKey,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          'bc',
          'mutasi-data',
          variables.job,
          variables.groupKey,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'potential-promotion', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'job-submitted'],
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

// Hook untuk submit all rotations (mutation)
export function useSubmitRotations() {
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async ({
      job,
      categorization,
    }: {
      job: string;
      categorization: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/submit-rotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: job.toUpperCase(),
          categorization: categorization,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rotations');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bc', 'locked-rotations', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['bc', 'job-submitted', variables.job],
      });
    },
  });

  return {
    submitRotations: submitMutation.mutateAsync,
    loading: submitMutation.isPending,
    error: submitMutation.error?.message || null,
  };
}

// Hook untuk check submitted status
export function useJobSubmitted(job: string, vessel: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bc', 'job-submitted', job, vessel],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/check-job-submitted?job=${job.toUpperCase()}&vessel=${vessel.toUpperCase()}`
      );
      const result = await response.json();
      return result.is_submitted || false;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    isSubmitted: data || false,
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk check pending changes
export function usePendingChanges(job: string, vessel: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bc', 'pending-changes', job, vessel],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/check-pending-changes?job=${job.toUpperCase()}&vessel=${vessel.toUpperCase()}`
      );
      const result = await response.json();
      return {
        hasChanges: result.has_changes || false,
        count: result.count || 0,
        affectedGroups: result.affected_groups || [],
      };
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    hasChanges: data?.hasChanges || false,
    count: data?.count || 0,
    affectedGroups: data?.affectedGroups || [],
    loading: isLoading,
    error: error?.message || null,
  };
}
