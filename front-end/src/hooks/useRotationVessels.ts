// src/hooks/useRotationVessels.ts
import { useState, useEffect, useCallback } from 'react';

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

export function useRotationVessels(type?: string, categorization?: string) {
  const [vessels, setVessels] = useState<RotationVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVessels = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (categorization) params.append('categorization', categorization);

      const url = `${API_BASE_URL}/rotation-vessels?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setVessels(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching vessels:', err);
      console.error('URL attempted:', `${API_BASE_URL}/rotation-vessels`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, categorization]);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  const createVessel = async (data: Omit<RotationVessel, 'id'>) => {
    try {
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

      await fetchVessels();
      return result;
    } catch (err: any) {
      console.error('Error creating vessel:', err);
      throw new Error(err.message || 'Failed to create vessel');
    }
  };

  const updateVessel = async (id: number, data: Omit<RotationVessel, 'id'>) => {
    try {
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

      await fetchVessels();
      return result;
    } catch (err: any) {
      console.error('Error updating vessel:', err);
      throw new Error(err.message || 'Failed to update vessel');
    }
  };

  const deleteVessel = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rotation-vessels/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete vessel');
      }

      await fetchVessels();
      return result;
    } catch (err: any) {
      console.error('Error deleting vessel:', err);
      throw new Error(err.message || 'Failed to delete vessel');
    }
  };

  return {
    vessels,
    loading,
    error,
    refetch: fetchVessels,
    createVessel,
    updateVessel,
    deleteVessel,
  };
}
