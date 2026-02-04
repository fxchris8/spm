// Kebutuhan: fetch data dashboard seamen
import { useQuery } from '@tanstack/react-query';

interface Seaman {
  'SEAMAN CODE': string;
  'SEAFARER CODE': string;
  'SEAMAN NAME': string;
  RANK: string;
  VESSEL: string;
  UMUR: number;
  CERTIFICATE: string;
  'DAY REMAINS': number;
}

// Fetch function
async function fetchDashboardData(): Promise<Seaman[]> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/dashboard-data`);

  if (!response.ok) {
    throw new Error('Gagal memuat data');
  }

  return response.json();
}

// Custom hook
export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-data'], // Unique key untuk cache
    queryFn: fetchDashboardData,
    staleTime: 10 * 60 * 1000, // Fresh 10 menit (sesuai config di main.tsx)
    refetchInterval: 5 * 60 * 1000, // Auto-refetch setiap 5 menit (opsional)
  });

  return {
    seamenData: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch, // Function untuk manual refetch kalau perlu
  };
}
