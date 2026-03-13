import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface OffboardSeaman {
  seamancode: string;
  seafarercode: string;
  name: string;
  last_position: string;
  last_location: string;
  prevlocation: string | null;
  age: number;
  certificate: string;
}

async function fetchOffboardDetail(location: string): Promise<OffboardSeaman[]> {
  const response = await fetch(
    `${API_BASE_URL}/offboard-detail/${encodeURIComponent(location)}`
  );

  if (!response.ok) {
    throw new Error('Gagal memuat data offboard detail');
  }

  return response.json();
}

export function useOffboardDetail(location: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ['offboard-detail', location],
    queryFn: () => fetchOffboardDetail(location!),
    enabled: !!location,
    staleTime: 5 * 60 * 1000,
  });

  return {
    seamen: data || [],
    loading: isLoading,
  };
}
