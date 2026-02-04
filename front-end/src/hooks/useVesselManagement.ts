// Kebutuhan: fetch rotation ship config, create, update, delete
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RotationVessel {
  id: number;
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  categorization: string;
  groups: Record<string, string[]>;
}

interface CreateVesselData {
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  categorization: string;
  groups: Record<string, string[]>;
}

interface ApiResponse {
  message: string;
  data?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============= FETCH FUNCTIONS =============

// Fetch all rotation Vessels or filter by type
async function fetchRotationVessels(type?: string): Promise<RotationVessel[]> {
  const url = type
    ? `${API_BASE_URL}/rotation-vessels?type=${type}`
    : `${API_BASE_URL}/rotation-vessels`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch rotation configs');
  }

  return response.json();
}

// Create new config
async function createRotationVessel(
  data: CreateVesselData
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/rotation-vessels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create config');
  }

  return response.json();
}

// Update existing config
async function updateRotationVessel(
  id: number,
  data: Partial<CreateVesselData>
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/rotation-vessels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update vessel');
  }

  return response.json();
}

// Delete config
async function deleteRotationVessel(id: number): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/rotation-vessels/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete vessel');
  }

  return response.json();
}

// ============= CUSTOM HOOK =============

export function useVesselManagement(type?: string) {
  const queryClient = useQueryClient();
  const queryKey = type ? ['rotation-vessels', type] : ['rotation-vessels'];

  // ✅ Query untuk fetch data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchRotationVessels(type),
    staleTime: 10 * 60 * 1000, // Fresh 10 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  // ✅ Mutation untuk CREATE
  const createMutation = useMutation({
    mutationFn: createRotationVessel,
    onSuccess: () => {
      // Invalidate semua rotation-vessels queries
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  // ✅ Mutation untuk UPDATE
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateVesselData>;
    }) => updateRotationVessel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  // ✅ Mutation untuk DELETE
  const deleteMutation = useMutation({
    mutationFn: deleteRotationVessel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  // ============= WRAPPER FUNCTIONS =============

  const createVessel = async (data: CreateVesselData) => {
    return createMutation.mutateAsync(data);
  };

  const updateVessel = async (id: number, data: Partial<CreateVesselData>) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const deleteVessel = async (id: number) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    vessels: data || [],
    loading: isLoading,
    error: error?.message || null,
    createVessel,
    updateVessel,
    deleteVessel,
    refetch,
    // Status untuk loading state saat mutation
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
