// src/hooks/useRotationConfigs.ts
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RotationConfig {
  id: number;
  job_title: string;
  vessel: string;
  type: string;
  part: string;
  groups: Record<string, string[]>;
  created_at?: string;
  updated_at?: string;
}

export function useRotationConfigs(type?: string) {
  const [configs, setConfigs] = useState<RotationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const url = type
        ? `${API_BASE_URL}/rotation-configs?type=${type}`
        : `${API_BASE_URL}/rotation-configs`;

      // console.log('🔍 Fetching rotation configs from:', url);

      const response = await fetch(url);

      // console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('✅ Rotation configs loaded:', data.length, 'configs');
      // console.log('📊 Config data:', data);

      setConfigs(data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching configs:', err);
      console.error(
        'URL attempted:',
        type
          ? `${API_BASE_URL}/rotation-configs?type=${type}`
          : `${API_BASE_URL}/rotation-configs`
      );
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const createConfig = async (data: Omit<RotationConfig, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rotation-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create config');
      }

      await fetchConfigs();
      return result;
    } catch (err: any) {
      console.error('Error creating config:', err);
      throw new Error(err.message || 'Failed to create config');
    }
  };

  const updateConfig = async (id: number, data: Omit<RotationConfig, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rotation-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update config');
      }

      await fetchConfigs();
      return result;
    } catch (err: any) {
      console.error('Error updating config:', err);
      throw new Error(err.message || 'Failed to update config');
    }
  };

  const deleteConfig = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rotation-configs/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete config');
      }

      await fetchConfigs();
      return result;
    } catch (err: any) {
      console.error('Error deleting config:', err);
      throw new Error(err.message || 'Failed to delete config');
    }
  };

  return {
    configs,
    loading,
    error,
    refetch: fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
