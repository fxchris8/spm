// Hook untuk fetch data rotation configs dan locked rotations untuk dashboard
import { useQuery } from '@tanstack/react-query';

interface RotationConfig {
  id: number;
  job_title: string;
  categorization: string;
  vessel: string;
  type: string;
  part: string;
  groups: Record<string, string[]>;
}

interface LockedRotation {
  id: number;
  group_key: string;
  job: string;
  vessel: string;
  schedule_data: any;
  crew_data: any;
  reliever_data: any;
  locked_seaman_codes: string[];
  locked_at: string;
}

interface DashboardRotationData {
  categorization: string;
  senior: {
    totalGroups: number;
    jobs: {
      jobTitle: string;
      groups: Array<{
        groupKey: string;
        groupName: string;
        isLocked: boolean;
        wajib: string[]; // Nama-nama nahkoda wajib
        reliever: string[]; // Nama-nama reliever
      }>;
    }[];
  };
  junior: {
    totalGroups: number;
    jobs: {
      jobTitle: string;
      groups: Array<{
        groupKey: string;
        groupName: string;
        isLocked: boolean;
        wajib: string[]; // Nama-nama junior wajib
        reliever: string[]; // Nama-nama reliever
      }>;
    }[];
  };
}

// Fetch rotation configs
async function fetchRotationConfigs(): Promise<RotationConfig[]> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/rotation-configs`);

  if (!response.ok) {
    throw new Error('Failed to fetch rotation configs');
  }

  return response.json();
}

// Fetch locked rotations for specific job and vessel
async function fetchLockedRotationsForJob(
  job: string,
  vessel: string
): Promise<LockedRotation[]> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(
    `${API_BASE_URL}/locked-rotations?job=${job}&vessel=${vessel}`
  );

  if (!response.ok) {
    // Return empty array if not found (404) or error
    if (response.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch locked rotations');
  }

  const result = await response.json();
  // API returns { data: [...] }
  if (result && result.data && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

// Fetch all locked rotations for all configs
async function fetchAllLockedRotations(
  configs: RotationConfig[]
): Promise<LockedRotation[]> {
  const allLockedRotations: LockedRotation[] = [];

  // Create unique job-vessel pairs
  const jobVesselPairs = new Map<string, { job: string; vessel: string }>();
  configs.forEach(config => {
    const key = `${config.job_title}-${config.vessel}`;
    if (!jobVesselPairs.has(key)) {
      jobVesselPairs.set(key, {
        job: config.job_title,
        vessel: config.vessel,
      });
    }
  });

  // Fetch locked rotations for each job-vessel pair
  const promises = Array.from(jobVesselPairs.values()).map(({ job, vessel }) =>
    fetchLockedRotationsForJob(job, vessel)
  );

  const results = await Promise.all(promises);
  results.forEach(rotations => {
    allLockedRotations.push(...rotations);
  });

  return allLockedRotations;
}

// Helper function to extract names from table data
function extractNamesFromTable(tableData: any): string[] {
  if (!tableData || !tableData.data) return [];

  return tableData.data.map((row: any) => {
    return row.name || row.NAME || row.Name || 'Unknown';
  });
}

// Helper function to sort jobs by predefined order
function sortJobsByOrder(jobs: any[]): any[] {
  const jobOrder = [
    'nakhoda',
    'KKM',
    'mualimI',
    'masinisII',
    'mualimII',
    'masinisIII',
    'mualimIII',
    'masinisIV',
  ];

  return jobs.sort((a, b) => {
    const indexA = jobOrder.indexOf(a.jobTitle);
    const indexB = jobOrder.indexOf(b.jobTitle);

    // If not found in order, put at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

// Custom hook
export function useDashboardRotationData() {
  // Fetch rotation configs
  const { data: configs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['rotation-configs'],
    queryFn: fetchRotationConfigs,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch locked rotations (depends on configs)
  const { data: lockedRotations = [], isLoading: loadingLocked } = useQuery({
    queryKey: ['dashboard-locked-rotations', configs.length],
    queryFn: () => fetchAllLockedRotations(configs),
    enabled: configs.length > 0, // Only fetch when configs are loaded
    staleTime: 5 * 60 * 1000,
  });

  // Process data by categorization
  const dashboardData: DashboardRotationData[] = [];

  // Group by categorization
  const categorizations = ['container', 'manalagi', 'bc'];

  categorizations.forEach(cat => {
    const categoryConfigs = configs.filter(
      c => c.categorization.toLowerCase() === cat
    );

    if (categoryConfigs.length === 0) return;

    // Process SENIOR
    const seniorConfigs = categoryConfigs.filter(c => c.type === 'senior');
    const seniorJobs: any[] = [];

    seniorConfigs.forEach(config => {
      const groups = Object.keys(config.groups).map(groupKey => {
        // Find locked rotation for this group and job
        const locked = lockedRotations.find(
          lr =>
            lr.group_key === groupKey &&
            lr.job.toLowerCase() === config.job_title.toLowerCase() &&
            lr.vessel.toLowerCase() === config.vessel.toLowerCase()
        );

        return {
          groupKey,
          groupName: groupKey.replace('container_rotation', 'Group ').replace('manalagi_rotation', 'Group ').replace('bc_rotation', 'Group '),
          isLocked: !!locked,
          wajib: locked ? extractNamesFromTable(locked.crew_data) : [],
          reliever: locked ? extractNamesFromTable(locked.reliever_data) : [],
        };
      });

      seniorJobs.push({
        jobTitle: config.job_title,
        groups,
      });
    });

    // Process JUNIOR
    const juniorConfigs = categoryConfigs.filter(c => c.type === 'junior');
    const juniorJobs: any[] = [];

    juniorConfigs.forEach(config => {
      const groups = Object.keys(config.groups).map(groupKey => {
        // Find locked rotation for this group and job
        const locked = lockedRotations.find(
          lr =>
            lr.group_key === groupKey &&
            lr.job.toLowerCase() === config.job_title.toLowerCase() &&
            lr.vessel.toLowerCase() === config.vessel.toLowerCase()
        );

        return {
          groupKey,
          groupName: groupKey.replace('container_rotation', 'Group ').replace('manalagi_rotation', 'Group ').replace('bc_rotation', 'Group '),
          isLocked: !!locked,
          wajib: locked ? extractNamesFromTable(locked.crew_data) : [],
          reliever: locked ? extractNamesFromTable(locked.reliever_data) : [],
        };
      });

      juniorJobs.push({
        jobTitle: config.job_title,
        groups,
      });
    });

    // Calculate total groups
    const seniorTotalGroups = seniorConfigs.reduce(
      (sum, config) => sum + Object.keys(config.groups).length,
      0
    );
    const juniorTotalGroups = juniorConfigs.reduce(
      (sum, config) => sum + Object.keys(config.groups).length,
      0
    );

    dashboardData.push({
      categorization: cat,
      senior: {
        totalGroups: seniorTotalGroups,
        jobs: sortJobsByOrder(seniorJobs),
      },
      junior: {
        totalGroups: juniorTotalGroups,
        jobs: sortJobsByOrder(juniorJobs),
      },
    });
  });

  return {
    dashboardData,
    loading: loadingConfigs || loadingLocked,
    error: null,
  };
}
