import { useQuery } from '@tanstack/react-query';
import {
  BC_VESSELS,
  CONTAINER_VESSELS,
  MANALAGI_VESSELS,
  MT_VESSELS,
  TB_VESSELS,
  TK_VESSELS,
} from '../constants/vessels';

import { buildNormalizedVesselSet } from '../utils/vesselNormalizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function fetchVesselCategories(): Promise<Record<string, string[]>> {
  const response = await fetch(`${API_BASE_URL}/vessel-categories`);
  if (!response.ok) throw new Error('Failed to fetch vessel categories');
  return response.json();
}

export function useVesselCategories() {
  const { data } = useQuery({
    queryKey: ['vessel-categories'],
    queryFn: fetchVesselCategories,
    staleTime: 10 * 60 * 1000, // cache 10 menit (vessel config jarang berubah)
    gcTime: 60 * 60 * 1000,
  });

  const getSet = (rawList: string[] | undefined, fallbackSet: Set<string>) =>
    buildNormalizedVesselSet(rawList && rawList.length > 0 ? rawList : fallbackSet);

  return {
    containerVessels: getSet(data?.container, CONTAINER_VESSELS),
    manalagiVessels: getSet(data?.manalagi, MANALAGI_VESSELS),
    bcVessels: getSet(data?.bc, BC_VESSELS),
    mtVessels: getSet(data?.mt, MT_VESSELS),
    tbVessels: getSet(data?.tb, TB_VESSELS),
    tkVessels: getSet(data?.tk, TK_VESSELS),
  };
}
