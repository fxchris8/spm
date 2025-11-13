// Kebutuhan: fetch data similar seamen berdasarkan seamanCode
import { useQuery } from '@tanstack/react-query';

interface SimilarSeaman {
  seamancode: string;
  seafarercode: string;
  name: string;
  last_position: string;
  last_location: string;
  age: number;
  certificate: string;
  'DAY REMAINS DIFF': number;
}

interface SimilarResponse {
  status: string;
  message?: string;
  data: SimilarSeaman[];
}

// Fetch function
async function fetchSimilarSeamen(
  seamanCode: string
): Promise<SimilarSeaman[]> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/similarity/${seamanCode}`);

  if (!response.ok) {
    throw new Error('Gagal mengambil data similar');
  }

  const data: SimilarResponse = await response.json();

  if (data.status === 'error') {
    throw new Error(data.message || 'Error fetching similar seamen');
  }

  return data.data;
}

// Custom hook
export function useSimilarSeamen(seamanCode: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['similar-seamen', seamanCode], // Cache per seamanCode
    queryFn: () => fetchSimilarSeamen(seamanCode!),
    enabled: !!seamanCode, // Hanya fetch kalau seamanCode ada
    staleTime: 15 * 60 * 1000, // Fresh 15 menit (data similar jarang berubah)
  });

  return {
    similarSeamen: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}
