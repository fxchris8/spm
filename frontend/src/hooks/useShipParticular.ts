// Hook untuk mengambil daftar kapal dari tabel ship_particular via backend API
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ShipParticular {
  vesselid: string;
  vesselname: string;
  companyid: number;
  dblgrosstonnage: string;
  inidnationality: number;
  vcmainpower: string;
  vesseltypeid: number;
  synced_at: string;
}

async function fetchShipParticular(search?: string): Promise<ShipParticular[]> {
  const url = new URL(`${API_BASE_URL}/ship-particular`);
  if (search) url.searchParams.set('search', search);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch ship particular data');
  }
  return response.json();
}

/**
 * Hook untuk mendapatkan daftar semua kapal dari ship_particular table.
 * Data di-cache 30 menit karena jarang berubah.
 */
export function useShipParticular(search?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ship-particular', search ?? ''],
    queryFn: () => fetchShipParticular(search),
    staleTime: 30 * 60 * 1000,  // Fresh 30 menit
    gcTime: 60 * 60 * 1000,     // Cache 1 jam
  });

  return {
    ships: data ?? [],
    vesselNames: (data ?? []).map(s => s.vesselname),
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

/**
 * Trigger sync Ship Particular dari API Pusat ke DB lokal.
 */
export async function syncShipParticular(): Promise<{
  status: string;
  message: string;
  records_synced: number;
}> {
  const response = await fetch(`${API_BASE_URL}/ship-particular/sync`, {
    method: 'POST',
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Sync failed');
  }
  return response.json();
}
