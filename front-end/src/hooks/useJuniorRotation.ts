// src/hooks/useJuniorRotation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// Calculate next group vessels and promotion info
function calculateNextGroupInfo(
  selectedGroup: string,
  groups: Record<string, string[]>,
  mappedJob: string
) {
  const groupKeys = Object.keys(groups);
  const currentGroupNum = parseInt(
    selectedGroup.replace('container_rotation', '')
  );

  let nextGroupVessels: string[] = [];
  let nextGroupKey = '';
  let promotionVessels: string[] = [];
  let promotionJob = '';

  if (currentGroupNum === 1) {
    const group2Key = groupKeys.find(k => k === 'container_rotation2') || '';
    const group3Key = groupKeys.find(k => k === 'container_rotation3') || '';

    nextGroupVessels = [
      ...(groups[group2Key] || []),
      ...(groups[group3Key] || []),
    ];
    nextGroupKey = `${group2Key},${group3Key}`;
  } else if (currentGroupNum === 2) {
    const group3Key = groupKeys.find(k => k === 'container_rotation3') || '';
    const group4Key = groupKeys.find(k => k === 'container_rotation4') || '';

    nextGroupVessels = [
      ...(groups[group3Key] || []),
      ...(groups[group4Key] || []),
    ];
    nextGroupKey = `${group3Key},${group4Key}`;
  } else if (currentGroupNum === 3) {
    const group4Key = groupKeys.find(k => k === 'container_rotation4') || '';
    const group1Key = groupKeys.find(k => k === 'container_rotation1') || '';

    const group4Vessels = [...(groups[group4Key] || [])];
    const lowerRankJob = JOB_HIERARCHY[mappedJob];

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
    const group1Key = groupKeys.find(k => k === 'container_rotation1') || '';
    const group2Key = groupKeys.find(k => k === 'container_rotation2') || '';

    const lowerRankJob = JOB_HIERARCHY[mappedJob];

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
  const getPromotionEndpoint = (job: string): string => {
    const endpoints: Record<string, string> = {
      mualimII: `${API_BASE_URL}/seamen/promotion-candidates-mualimII`,
      mualimIII: `${API_BASE_URL}/seamen/promotion-candidates-mualimIII`,
      masinisIII: `${API_BASE_URL}/seamen/promotion-candidates-masinisIII`,
      masinisIV: `${API_BASE_URL}/seamen/promotion-candidates-masinisIV`,
    };
    return (
      endpoints[job] || `${API_BASE_URL}/seamen/promotion-candidates-nakhoda`
    );
  };

  const endpoint = getPromotionEndpoint(job);
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === 'success') {
    return result.data.map((item: any) => ({
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
  }

  throw new Error(result.message || 'Failed to fetch promotion candidates');
}

// Lock rotation
async function lockRotation(payload: {
  groupKey: string;
  job: string;
  scheduleTable: string;
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
}): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/locked-rotations/${payload.selectedGroup}?job=${payload.job}`,
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

// Hook untuk promotion candidates (lazy load per job)
export function usePromotionCandidates(
  job: string,
  groupKey: string | null,
  enabled: boolean = true
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['junior-promotion-candidates', job],
    queryFn: () => fetchPromotionCandidates(job),
    // Only fetch for group 3 and 4
    enabled:
      enabled &&
      !!groupKey &&
      (groupKey === 'container_rotation3' ||
        groupKey === 'container_rotation4'),
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
