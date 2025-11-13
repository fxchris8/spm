// Kebutuhan: hook khusus untuk RotationContainer yang hanya butuh fetch data (read-only)
import { useQuery } from '@tanstack/react-query';

export interface RotationConfig {
  id: number;
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  groups: Record<string, string[]>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch rotation configs by type
async function fetchRotationConfigsByType(
  type: string
): Promise<RotationConfig[]> {
  const response = await fetch(`${API_BASE_URL}/rotation-configs?type=${type}`);

  if (!response.ok) {
    throw new Error('Failed to fetch rotation configs');
  }

  return response.json();
}

// Hook khusus untuk RotationContainer (read-only, tidak perlu CRUD)
export function useRotationContainer(type: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rotation-configs', type],
    queryFn: () => fetchRotationConfigsByType(type),
    staleTime: 10 * 60 * 1000, // Fresh 10 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  return {
    configs: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}
