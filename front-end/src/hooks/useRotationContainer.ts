// Kebutuhan: hook khusus untuk RotationContainer yang hanya butuh fetch data (read-only)
import { useQuery } from '@tanstack/react-query';

export interface RotationConfig {
  id: number;
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  categorization: string;
  groups: Record<string, string[]>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fetch rotation configs by type and categorization
async function fetchRotationConfigs(
  type?: string,
  categorization?: string
): Promise<RotationConfig[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (categorization) params.append('categorization', categorization);

  const url = `${API_BASE_URL}/rotation-configs?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch rotation configs');
  }

  return response.json();
}

// Hook khusus untuk RotationContainer (read-only, tidak perlu CRUD)
export function useRotationContainer(type?: string, categorization?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rotation-configs', type, categorization],
    queryFn: () => fetchRotationConfigs(type, categorization),
    staleTime: 10 * 60 * 1000, // Fresh 10 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  return {
    configs: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}
