import { useQuery } from '@tanstack/react-query';
import {
  BC_VESSELS,
  CONTAINER_VESSELS,
  MANALAGI_VESSELS,
} from '../constants/vessels';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function fetchVesselCategories(): Promise<Record<string, string[]>> {
  const response = await fetch(`${API_BASE_URL}/vessel-categories`);
  if (!response.ok) throw new Error('Failed to fetch vessel categories');
  return response.json();
}

/**
 * Hook untuk mendapatkan daftar kapal per kategori dari database.
 * Konsisten dengan konfigurasi yang dikelola di Vessel Management UI.
 *
 * Jika API belum selesai / gagal, fallback ke constants/vessels.ts
 * sehingga UI tetap berfungsi.
 */
export function useVesselCategories() {
  const { data } = useQuery({
    queryKey: ['vessel-categories'],
    queryFn: fetchVesselCategories,
    staleTime: 10 * 60 * 1000, // cache 10 menit (vessel config jarang berubah)
    gcTime: 60 * 60 * 1000,
  });

  return {
    containerVessels: new Set<string>(
      data?.container ?? Array.from(CONTAINER_VESSELS)
    ),
    manalagiVessels: new Set<string>(
      data?.manalagi ?? Array.from(MANALAGI_VESSELS)
    ),
    bcVessels: new Set<string>(data?.bc ?? Array.from(BC_VESSELS)),
  };
}
