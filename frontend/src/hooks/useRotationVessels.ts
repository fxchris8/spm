// src/hooks/useRotationVessels.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RotationVessel {
  id: number;
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  categorization: string;
  groups: Record<string, string[]>;
  created_at?: string;
  updated_at?: string;
}

async function fetchVesselsApi(
  type?: string,
  categorization?: string
): Promise<RotationVessel[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (categorization) params.append('categorization', categorization);

  const url = `${API_BASE_URL}/rotation-vessels?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useRotationVessels(type?: string, categorization?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['rotation-vessels', type, categorization].filter(Boolean);

  const {
    data: vessels = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchVesselsApi(type, categorization),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<RotationVessel, 'id'>) => {
      const response = await fetch(`${API_BASE_URL}/rotation-vessels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create vessel');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Omit<RotationVessel, 'id'>;
    }) => {
      const response = await fetch(`${API_BASE_URL}/rotation-vessels/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update vessel');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/rotation-vessels/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete vessel');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  return {
    vessels,
    loading,
    error: error ? (error as Error).message : null,
    refetch,
    createVessel: (data: Omit<RotationVessel, 'id'>) =>
      createMutation.mutateAsync(data),
    updateVessel: (id: number, data: Omit<RotationVessel, 'id'>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteVessel: (id: number) => deleteMutation.mutateAsync(id),
  };
}
