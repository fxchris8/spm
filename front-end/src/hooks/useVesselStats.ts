// Hook untuk fetch vessel statistics by category
import { useQuery } from '@tanstack/react-query';

interface VesselStats {
  container: number;
  manalagi: number;
  bc: number;
}

async function fetchVesselStats(): Promise<VesselStats> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/vessel-stats`);

  if (!response.ok) {
    throw new Error('Failed to fetch vessel statistics');
  }

  return response.json();
}

export function useVesselStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vessel-stats'],
    queryFn: fetchVesselStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    vesselStats: data || {
      container: 0,
      manalagi: 0,
      bc: 0,
    },
    loading: isLoading,
    error,
  };
}
