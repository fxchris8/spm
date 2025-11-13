// Kebutuhan: fetch rotation ship config, create, update, delete
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RotationConfig {
  id: number;
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  groups: Record<string, string[]>;
}

interface CreateConfigData {
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  groups: Record<string, string[]>;
}

interface ApiResponse {
  message: string;
  data?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============= FETCH FUNCTIONS =============

// Fetch all rotation configs or filter by type
async function fetchRotationConfigs(type?: string): Promise<RotationConfig[]> {
  const url = type
    ? `${API_BASE_URL}/rotation-configs?type=${type}`
    : `${API_BASE_URL}/rotation-configs`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch rotation configs');
  }

  return response.json();
}

// Create new config
async function createRotationConfig(
  data: CreateConfigData
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/rotation-configs`, {
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
async function updateRotationConfig(
  id: number,
  data: Partial<CreateConfigData>
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/rotation-configs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update config');
  }

  return response.json();
}

// Delete config
async function deleteRotationConfig(id: number): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/rotation-configs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete config');
  }

  return response.json();
}

// ============= CUSTOM HOOK =============

export function useRotationShipConfig(type?: string) {
  const queryClient = useQueryClient();
  const queryKey = type ? ['rotation-configs', type] : ['rotation-configs'];

  // ✅ Query untuk fetch data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchRotationConfigs(type),
    staleTime: 10 * 60 * 1000, // Fresh 10 menit
    gcTime: 30 * 60 * 1000, // Cache 30 menit
  });

  // ✅ Mutation untuk CREATE
  const createMutation = useMutation({
    mutationFn: createRotationConfig,
    onSuccess: () => {
      // Invalidate semua rotation-configs queries
      queryClient.invalidateQueries({ queryKey: ['rotation-configs'] });
    },
  });

  // ✅ Mutation untuk UPDATE
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateConfigData>;
    }) => updateRotationConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-configs'] });
    },
  });

  // ✅ Mutation untuk DELETE
  const deleteMutation = useMutation({
    mutationFn: deleteRotationConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotation-configs'] });
    },
  });

  // ============= WRAPPER FUNCTIONS =============

  const createConfig = async (data: CreateConfigData) => {
    return createMutation.mutateAsync(data);
  };

  const updateConfig = async (id: number, data: Partial<CreateConfigData>) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const deleteConfig = async (id: number) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    configs: data || [],
    loading: isLoading,
    error: error?.message || null,
    createConfig,
    updateConfig,
    deleteConfig,
    refetch,
    // Status untuk loading state saat mutation
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
