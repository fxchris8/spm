// src/hooks/useJuniorRotation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sortGroupKeys } from '../utils/vesselMappingUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============= TYPES =============

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

interface PromotionCandidate {
  seamancode: string | number;
  name: string;
  rank: string;
  vessel: string;
  history: string;
  matchCount: number;
}

interface LockedRotation {
  id: string;
  group_key: string;
  job: string;
  crew_data: CrewToRelieve[] | string;
  reliever_data: Record<string, ReplacementOption | null> | string;
  is_active: boolean;
  locked_at: string;
}

// ============= JOB MAPPING UTILITIES =============

export const JOB_MAPPING: Record<string, string> = {
  mualimII: 'MUALIM II',
  mualimIII: 'MUALIM III',
  masinisIII: 'MASINIS III',
  masinisIV: 'MASINIS IV',
  nakhoda: 'NAKHODA',
  mualimI: 'MUALIM I',
  KKM: 'KKM',
  masinisI: 'MASINIS I',
  masinisII: 'MASINIS II',
};

export const JOB_HIERARCHY: Record<string, string> = {
  'MUALIM II': 'MUALIM III',
  'MUALIM III': 'JURU MUDI',
  'MASINIS III': 'MASINIS IV',
  'MASINIS IV': 'JURU MINYAK',
};

export function getMappedJob(job: string): string {
  return JOB_MAPPING[job] || job.toUpperCase();
}

export function formatJobName(jobName: string): string {
  return JOB_MAPPING[jobName] || jobName.toUpperCase();
}

// ============= FETCH FUNCTIONS =============

// Fetch all locked rotations for a specific job
async function fetchLockedRotations(job: string): Promise<LockedRotation[]> {
  const mappedJob = getMappedJob(job);
  const response = await fetch(
    `${API_BASE_URL}/locked-rotations?job=${mappedJob}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === 'success') {
    return result.data || [];
  }

  throw new Error(result.message || 'Failed to fetch locked rotations');
}

// Fetch crew to relieve for a specific group
async function fetchCrewToRelieve(
  groupKey: string,
  groups: Record<string, string[]>,
  job: string
): Promise<CrewToRelieve[]> {
  const vessels = groups[groupKey] || [];
  const vesselQuery = vessels.join(',');
  const mappedJob = getMappedJob(job);

  const response = await fetch(
    `${API_BASE_URL}/get_crew_to_relieve?vessel_group=${encodeURIComponent(
      vesselQuery
    )}&job=${mappedJob}&days_threshold=30&days_elapsed_threshold=335`
  );

  const result = await response.json();

  if (result.status === 'success') {
    return result.data || [];
  }

  throw new Error(result.message || 'Failed to fetch crew to relieve');
}

// Calculate next group vessels and promotion info generically
export function calculateNextGroupInfo(
  selectedGroup: string,
  groups: Record<string, string[]>,
  mappedJob: string
) {
  const sortedGroupKeys = sortGroupKeys(groups);

  const T = sortedGroupKeys.length;
  const currentIndex = sortedGroupKeys.indexOf(selectedGroup);

  if (currentIndex === -1 || T === 0) {
    return {
      nextGroupVessels: [],
      nextGroupKey: '',
      promotionVessels: [],
      promotionJob: '',
    };
  }

  if (T === 1) {
    return {
      nextGroupVessels: groups[selectedGroup] || [],
      nextGroupKey: selectedGroup,
      promotionVessels: [],
      promotionJob: '',
    };
  }

  const i = currentIndex;
  const lowerRankJob = JOB_HIERARCHY[mappedJob];

  let nextGroupVessels: string[] = [];
  let nextGroupKey = '';
  let promotionVessels: string[] = [];
  let promotionJob = '';

  if (T === 2) {
    if (i === 0) {
      // Group 1: next is Group 2
      const g2 = sortedGroupKeys[1];
      nextGroupVessels = [...(groups[g2] || [])];
      nextGroupKey = g2;
    } else {
      // Group 2: promotion from Group 1
      const g1 = sortedGroupKeys[0];
      if (lowerRankJob) {
        promotionJob = lowerRankJob;
        promotionVessels = [...(groups[g1] || [])];
        nextGroupVessels = [...promotionVessels];
        nextGroupKey = `${g1}(${lowerRankJob})`;
      } else {
        nextGroupVessels = [...(groups[g1] || [])];
        nextGroupKey = g1;
      }
    }
  } else if (T === 3) {
    if (i === 0) {
      // Group 1: next are Group 2, 3
      const g2 = sortedGroupKeys[1];
      const g3 = sortedGroupKeys[2];
      nextGroupVessels = [...(groups[g2] || []), ...(groups[g3] || [])];
      nextGroupKey = `${g2},${g3}`;
    } else if (i === 1) {
      // Group 2: circular next are Group 3, 1
      const g3 = sortedGroupKeys[2];
      const g1 = sortedGroupKeys[0];
      nextGroupVessels = [...(groups[g3] || []), ...(groups[g1] || [])];
      nextGroupKey = `${g3},${g1}`;
    } else {
      // Group 3: Group 1, 2 + promotion from Group 1
      const g1 = sortedGroupKeys[0];
      const g2 = sortedGroupKeys[1];
      if (lowerRankJob) {
        promotionJob = lowerRankJob;
        promotionVessels = [...(groups[g1] || [])];
        nextGroupVessels = [
          ...(groups[g1] || []),
          ...(groups[g2] || []),
        ];
        nextGroupKey = `${g1},${g2}(${lowerRankJob})`;
      } else {
        nextGroupVessels = [
          ...(groups[g1] || []),
          ...(groups[g2] || []),
        ];
        nextGroupKey = `${g1},${g2}`;
      }
    }
  } else {
    // T >= 4 (standard container junior rotation behavior)
    if (i < T - 2) {
      // Middle groups (e.g. Group 1, Group 2 in T=4)
      const gNext1 = sortedGroupKeys[i + 1];
      const gNext2 = sortedGroupKeys[i + 2];
      nextGroupVessels = [
        ...(groups[gNext1] || []),
        ...(groups[gNext2] || []),
      ];
      nextGroupKey = `${gNext1},${gNext2}`;
    } else if (i === T - 2) {
      // Second to last group (e.g. Group 3 in T=4): next group + promotion from Group 1
      const gLast = sortedGroupKeys[T - 1];
      const g1 = sortedGroupKeys[0];
      const gLastVessels = [...(groups[gLast] || [])];

      if (lowerRankJob) {
        promotionJob = lowerRankJob;
        promotionVessels = [...(groups[g1] || [])];
        nextGroupVessels = [...gLastVessels, ...promotionVessels];
        nextGroupKey = `${gLast},${g1}(${lowerRankJob})`;
      } else {
        nextGroupVessels = gLastVessels;
        nextGroupKey = gLast;
      }
    } else {
      // Last group (e.g. Group 4 in T=4): promotion from Group 1 and Group 2
      const g1 = sortedGroupKeys[0];
      const g2 = sortedGroupKeys[1];

      if (lowerRankJob) {
        promotionJob = lowerRankJob;
        promotionVessels = [
          ...(groups[g1] || []),
          ...(groups[g2] || []),
        ];
        nextGroupKey = `${g1},${g2}(${lowerRankJob})`;
        nextGroupVessels = [...promotionVessels];
      } else {
        nextGroupVessels = [
          ...(groups[g1] || []),
          ...(groups[g2] || []),
        ];
        nextGroupKey = `${g1},${g2}`;
      }
    }
  }

  return {
    nextGroupVessels,
    nextGroupKey,
    promotionVessels,
    promotionJob,
  };
}

// Fetch replacement options
async function fetchReplacementOptions(
  groupKey: string,
  groups: Record<string, string[]>,
  job: string
): Promise<ReplacementOption[]> {
  const mappedJob = getMappedJob(job);
  const { nextGroupVessels, nextGroupKey, promotionVessels, promotionJob } =
    calculateNextGroupInfo(groupKey, groups, mappedJob);

  const vesselsQuery = nextGroupVessels.join(',');
  let apiUrl = `${API_BASE_URL}/get_available_replacements?job=${mappedJob}&vessel_group=${encodeURIComponent(
    groupKey
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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === 'success') {
    return result.data || [];
  }

  throw new Error(result.message || 'Failed to fetch replacement options');
}

// Fetch promotion candidates
async function fetchPromotionCandidates(
  job: string
): Promise<PromotionCandidate[]> {
  const getPromotionEndpoint = (job: string): string | null => {
    const endpoints: Record<string, string> = {
      nakhoda: `${API_BASE_URL}/seamen/promotion-candidates-nakhoda`,
      KKM: `${API_BASE_URL}/seamen/promotion-candidates-kkm`,
      mualimI: `${API_BASE_URL}/seamen/promotion-candidates-mualimI`,
      masinisII: `${API_BASE_URL}/seamen/promotion-candidates-masinisII`,
      mualimII: `${API_BASE_URL}/seamen/promotion-candidates-mualimII`,
      mualimIII: `${API_BASE_URL}/seamen/promotion-candidates-mualimIII`,
      masinisIII: `${API_BASE_URL}/seamen/promotion-candidates-masinisIII`,
      masinisIV: `${API_BASE_URL}/seamen/promotion-candidates-masinisIV`,
    };
    return endpoints[job] || null;
  };

  const endpoint = getPromotionEndpoint(job);
  if (!endpoint) {
    return [];
  }
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === 'success') {
    return result.data.map((item: any) => ({
      seamancode: item.code || item.seamancode || 0,
      name: item.name || '',
      vessel: item.vessel || item.last_location || '',
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
  }

  throw new Error(result.message || 'Failed to fetch promotion candidates');
}

// Lock rotation
async function lockRotation(payload: {
  groupKey: string;
  job: string;
  vessel: string;
  categorization: string;
  scheduleTable: {
    currentCrew: {
      seamancode: string;
      name: string;
      vessel: string;
      position: string;
      daysRemaining: number;
      daysElapsed: number;
      endDate: string;
    };
    replacement: {
      seamancode: string;
      name: string;
      position: string;
      lastVessel: string;
      status: string;
      daysSinceLastVessel: number;
    } | null;
  }[];
  nahkodaTable: CrewToRelieve[];
  daratTable: Record<string, ReplacementOption | null>;
  lockedSeamanCodes: string[];
}): Promise<any> {
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
async function unlockRotation(payload: {
  selectedGroup: string;
  job: string;
  vessel: string;
}): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/locked-rotations/${payload.selectedGroup}?job=${payload.job}&vessel=${payload.vessel}`,
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

// Hook untuk locked rotations (load once per job)
export function useLockedRotations(job: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['junior-locked-rotations', job],
    queryFn: () => fetchLockedRotations(job),
    staleTime: 5 * 60 * 1000, // Fresh 5 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
    retry: 2, // Retry 2 kali jika gagal
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Find if current group is locked
  const isGroupLocked = (groupKey: string) => {
    return (
      data?.some(lock => lock.group_key === groupKey && lock.is_active) || false
    );
  };

  // Get locked data for a specific group
  const getLockedData = (groupKey: string): LockedRotation | null => {
    return (
      data?.find(lock => lock.group_key === groupKey && lock.is_active) || null
    );
  };

  return {
    allLockedRotations: data || [],
    loading: isLoading,
    error: error?.message || null,
    isGroupLocked,
    getLockedData,
    refetch,
  };
}

// Hook untuk crew to relieve (lazy load per group)
export function useCrewToRelieve(
  groupKey: string | null,
  groups: Record<string, string[]>,
  job: string,
  lockedData: LockedRotation | null,
  enabled: boolean = true
) {
  const isLocked = !!lockedData;

  const { data, isLoading, error } = useQuery({
    queryKey: ['junior-crew-to-relieve', job, groupKey, isLocked],
    queryFn: async () => {
      // If group is locked, return locked data
      if (lockedData) {
        let crewData = lockedData.crew_data;
        if (typeof crewData === 'string') {
          crewData = JSON.parse(crewData);
        }
        return (crewData || []) as CrewToRelieve[];
      }

      // Otherwise fetch fresh data
      if (!groupKey) return [];
      return fetchCrewToRelieve(groupKey, groups, job);
    },
    enabled: enabled && !!groupKey,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    crewToRelieve: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk replacement options (lazy load per group)
export function useReplacementOptions(
  groupKey: string | null,
  groups: Record<string, string[]>,
  job: string,
  enabled: boolean = true
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['junior-replacement-options', job, groupKey],
    queryFn: () => {
      if (!groupKey) return [];
      return fetchReplacementOptions(groupKey, groups, job);
    },
    enabled: enabled && !!groupKey,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Calculate next group info
  const nextGroupInfo = groupKey
    ? calculateNextGroupInfo(groupKey, groups, getMappedJob(job))
    : {
        nextGroupVessels: [],
        nextGroupKey: '',
        promotionVessels: [],
        promotionJob: '',
      };

  return {
    replacementOptions: data || [],
    loading: isLoading,
    error: error?.message || null,
    nextGroupInfo,
  };
}

/**
 * Helper to determine if a group is in the last positions (for promotion eligibility)
 * For 2 or 3 groups: only the last group
 * For 4+ groups: the last 2 groups (e.g. Group 3 & 4)
 */
export function isLastGroups(
  groupKey: string | null,
  groups: Record<string, string[]>
): boolean {
  if (!groupKey || !groups) return false;
  const sortedKeys = sortGroupKeys(groups);
  const T = sortedKeys.length;
  if (T === 0) return false;
  if (T === 1) return true;

  const idx = sortedKeys.indexOf(groupKey);
  if (idx === -1) return false;

  if (T <= 3) {
    return idx === T - 1;
  }
  return idx >= T - 2;
}

// Hook untuk promotion candidates (lazy load per job)
export function usePromotionCandidates(
  job: string,
  groupKey: string | null,
  groups: Record<string, string[]>,
  enabled: boolean = true
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['junior-promotion-candidates', job],
    queryFn: () => fetchPromotionCandidates(job),
    // Only fetch for last groups
    enabled:
      enabled &&
      !!groupKey &&
      isLastGroups(groupKey, groups),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    promotionCandidates: data || [],
    loading: isLoading,
    error: error?.message || null,
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
        queryKey: ['junior-locked-rotations', variables.job],
      });

      // Invalidate crew and replacement data for this group
      // Use prefix matching to invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ['junior-crew-to-relieve', variables.job, variables.groupKey],
      });
      queryClient.invalidateQueries({
        queryKey: [
          'junior-replacement-options',
          variables.job,
          variables.groupKey,
        ],
      });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: unlockRotation,
    onSuccess: () => {
      // Invalidate all locked rotations queries to be safe
      queryClient.invalidateQueries({
        queryKey: ['junior-locked-rotations'],
      });

      // Invalidate all crew and replacement queries
      // This ensures UI updates even if response doesn't contain job/group_key
      queryClient.invalidateQueries({
        queryKey: ['junior-crew-to-relieve'],
      });
      queryClient.invalidateQueries({
        queryKey: ['junior-replacement-options'],
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
          job: formatJobName(job),
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
      // Invalidate queries for this job and vessel category
      queryClient.invalidateQueries({
        queryKey: ['junior-locked-rotations', variables.job],
      });
      queryClient.invalidateQueries({
        queryKey: ['job-submitted', variables.job, variables.categorization],
      });
      queryClient.invalidateQueries({
        queryKey: ['pending-changes', variables.job, variables.categorization],
      });
    },
  });

  return {
    submitRotations: submitMutation.mutateAsync,
    loading: submitMutation.isPending,
    error: submitMutation.error?.message || null,
  };
}

// Hook untuk check job submitted status (Junior uses categorization)
export function useJobSubmitted(job: string, categorization: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['job-submitted', job, categorization],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/check-job-submitted?job=${formatJobName(
          job
        )}&categorization=${categorization.toLowerCase()}`
      );
      const result = await response.json();
      return result.is_submitted || false;
    },
    staleTime: 5 * 60 * 1000, // Fresh 5 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  return {
    isSubmitted: data || false,
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook untuk check pending changes (status CHANGE with is_active FALSE)
export function usePendingChanges(job: string, categorization: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pending-changes', job, categorization],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/check-pending-changes?job=${formatJobName(
          job
        )}&categorization=${categorization.toLowerCase()}`
      );
      const result = await response.json();
      return {
        hasChanges: result.has_changes || false,
        count: result.count || 0,
        affectedGroups: result.affected_groups || [],
      };
    },
    staleTime: 1 * 60 * 1000, // Fresh 1 menit (lebih sering update untuk detect changes)
    gcTime: 10 * 60 * 1000, // Cache 10 menit
  });

  return {
    hasChanges: data?.hasChanges || false,
    count: data?.count || 0,
    affectedGroups: data?.affectedGroups || [],
    loading: isLoading,
    error: error?.message || null,
  };
}
