// Hook untuk fetch data rotation vessels dan locked rotations untuk dashboard
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface RotationVessel {
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

// Fetch rotation vessels
async function fetchRotationVessels(): Promise<RotationVessel[]> {
  const response = await fetch(`${API_BASE_URL}/rotation-vessels`);

  if (!response.ok) {
    throw new Error('Failed to fetch rotation vessels');
  }

  return response.json();
}

// Fetch locked rotations for specific job and vessel
async function fetchLockedRotationsForJob(
  job: string,
  vessel: string
): Promise<LockedRotation[]> {
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

// Fetch all locked rotations for all vessels
async function fetchAllLockedRotations(
  vessels: RotationVessel[]
): Promise<LockedRotation[]> {
  const allLockedRotations: LockedRotation[] = [];

  // Create unique job-vessel pairs
  const jobVesselPairs = new Map<string, { job: string; vessel: string }>();
  vessels.forEach(v => {
    const key = `${v.job_title}-${v.vessel}`;
    if (!jobVesselPairs.has(key)) {
      jobVesselPairs.set(key, {
        job: v.job_title,
        vessel: v.vessel,
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
  // Fetch rotation vessels
  const { data: vessels = [], isLoading: loadingVessels } = useQuery({
    queryKey: ['rotation-vessels'],
    queryFn: fetchRotationVessels,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch locked rotations (depends on vessels)
  const { data: lockedRotations = [], isLoading: loadingLocked } = useQuery({
    queryKey: ['dashboard-locked-rotations', vessels.length],
    queryFn: () => fetchAllLockedRotations(vessels),
    enabled: vessels.length > 0, // Only fetch when vessels are loaded
    staleTime: 5 * 60 * 1000,
  });

  // Process data by categorization
  const dashboardData: DashboardRotationData[] = [];

  // Group by categorization
  const categorizations = ['container', 'manalagi', 'bc'];

  categorizations.forEach(cat => {
    const categoryVessels = vessels.filter(
      v => v.categorization.toLowerCase() === cat
    );

    if (categoryVessels.length === 0) return;

    // Process SENIOR
    const seniorVessels = categoryVessels.filter(v => v.type === 'senior');
    const seniorJobs: any[] = [];

    seniorVessels.forEach(vessel => {
      const groups = Object.keys(vessel.groups).map(groupKey => {
        // Find locked rotation for this group and job
        const locked = lockedRotations.find(
          lr =>
            lr.group_key === groupKey &&
            lr.job.toLowerCase() === vessel.job_title.toLowerCase() &&
            lr.vessel.toLowerCase() === vessel.vessel.toLowerCase()
        );

        return {
          groupKey,
          groupName: groupKey
            .replace('container_rotation', 'Group ')
            .replace('manalagi_rotation', 'Group ')
            .replace('bc_rotation', 'Group '),
          isLocked: !!locked,
          wajib: locked ? extractNamesFromTable(locked.crew_data) : [],
          reliever: locked ? extractNamesFromTable(locked.reliever_data) : [],
        };
      });

      seniorJobs.push({
        jobTitle: vessel.job_title,
        groups,
      });
    });

    // Process JUNIOR
    const juniorVessels = categoryVessels.filter(v => v.type === 'junior');
    const juniorJobs: any[] = [];

    juniorVessels.forEach(vessel => {
      const groups = Object.keys(vessel.groups).map(groupKey => {
        // Find locked rotation for this group and job
        const locked = lockedRotations.find(
          lr =>
            lr.group_key === groupKey &&
            lr.job.toLowerCase() === vessel.job_title.toLowerCase() &&
            lr.vessel.toLowerCase() === vessel.vessel.toLowerCase()
        );

        return {
          groupKey,
          groupName: groupKey
            .replace('container_rotation', 'Group ')
            .replace('manalagi_rotation', 'Group ')
            .replace('bc_rotation', 'Group '),
          isLocked: !!locked,
          wajib: locked ? extractNamesFromTable(locked.crew_data) : [],
          reliever: locked ? extractNamesFromTable(locked.reliever_data) : [],
        };
      });

      juniorJobs.push({
        jobTitle: vessel.job_title,
        groups,
      });
    });

    // Calculate total groups
    const seniorTotalGroups = seniorVessels.reduce(
      (sum, v) => sum + Object.keys(v.groups).length,
      0
    );
    const juniorTotalGroups = juniorVessels.reduce(
      (sum, v) => sum + Object.keys(v.groups).length,
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
    loading: loadingVessels || loadingLocked,
    error: null,
  };
}
