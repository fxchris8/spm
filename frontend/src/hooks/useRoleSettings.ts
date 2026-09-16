// src/hooks/useRoleSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STORAGE_KEY = 'spm_role_settings';

export type RoleClassification = 'senior' | 'junior';

export type PositionKey =
  | 'nakhoda'
  | 'KKM'
  | 'mualimI'
  | 'masinisII'
  | 'mualimII'
  | 'mualimIII'
  | 'masinisIII'
  | 'masinisIV';

export type CategoryRoleSettings = {
  nakhoda?: RoleClassification;
  KKM?: RoleClassification;
  mualimI?: RoleClassification;
  masinisII?: RoleClassification;
  mualimII?: RoleClassification;
  mualimIII?: RoleClassification;
  masinisIII?: RoleClassification;
  masinisIV?: RoleClassification;
  [position: string]: RoleClassification | undefined;
};

export type RoleSettingsMap = {
  container: CategoryRoleSettings;
  manalagi: CategoryRoleSettings;
  bc: CategoryRoleSettings;
  [category: string]: CategoryRoleSettings;
};

export const DECK_POSITIONS: string[] = [
  'nakhoda',
  'mualimI',
  'mualimII',
  'mualimIII',
];

export const ENGINE_POSITIONS: string[] = [
  'KKM',
  'masinisII',
  'masinisIII',
  'masinisIV',
];

export const ALL_POSITIONS: string[] = [...DECK_POSITIONS, ...ENGINE_POSITIONS];

// Default standar SPIL: 4 Senior (Nakhoda, KKM, Mualim I, Masinis II) & 4 Junior
export const DEFAULT_CATEGORY_SETTINGS: CategoryRoleSettings = {
  nakhoda: 'senior',
  KKM: 'senior',
  mualimI: 'senior',
  masinisII: 'senior',
  mualimII: 'junior',
  mualimIII: 'junior',
  masinisIII: 'junior',
  masinisIV: 'junior',
};

export const DEFAULT_ROLE_SETTINGS: RoleSettingsMap = {
  container: { ...DEFAULT_CATEGORY_SETTINGS },
  manalagi: { ...DEFAULT_CATEGORY_SETTINGS },
  bc: { ...DEFAULT_CATEGORY_SETTINGS },
};

export const BASE_SENIOR_ROLES = [
  'nakhoda',
  'KKM',
  'mualimI',
  'masinisII',
];
export const BASE_JUNIOR_ROLES = [
  'mualimII',
  'mualimIII',
  'masinisIII',
  'masinisIV',
];

function getStoredSettings(): RoleSettingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        container: { ...DEFAULT_ROLE_SETTINGS.container, ...parsed.container },
        manalagi: { ...DEFAULT_ROLE_SETTINGS.manalagi, ...parsed.manalagi },
        bc: { ...DEFAULT_ROLE_SETTINGS.bc, ...parsed.bc },
      };
    }
  } catch (e) {
    console.warn('Failed to parse role settings from localStorage', e);
  }
  return DEFAULT_ROLE_SETTINGS;
}

function saveStoredSettings(settings: RoleSettingsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save role settings to localStorage', e);
  }
}

async function fetchRoleSettings(): Promise<RoleSettingsMap> {
  const res = await fetch(`${API_BASE_URL}/role-settings`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memuat pengaturan role dari server');
  }
  const json = await res.json();
  if (json.status === 'success' && json.data) {
    saveStoredSettings(json.data);
    return json.data;
  }
  throw new Error('Format response role-settings tidak valid');
}

async function updateRoleSettingApi(payload: {
  categorization: string;
  position: string;
  role_type: RoleClassification;
}): Promise<RoleSettingsMap> {
  const res = await fetch(`${API_BASE_URL}/role-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal menyimpan pengaturan role');
  }

  const json = await res.json();
  return json.data;
}

async function resetRoleSettingsApi(categorization: string): Promise<RoleSettingsMap> {
  const res = await fetch(`${API_BASE_URL}/role-settings/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categorization }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal mereset pengaturan role');
  }

  const json = await res.json();
  return json.data;
}

export function useRoleSettings() {
  const queryClient = useQueryClient();

  const {
    data: settings = getStoredSettings(),
    isLoading,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    queryKey: ['role-settings'],
    queryFn: fetchRoleSettings,
    placeholderData: getStoredSettings,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const hasAuthoritativeSettings = !isLoading && !isPlaceholderData && !error && Boolean(settings);

  const mutation = useMutation({
    mutationFn: updateRoleSettingApi,
    onMutate: async newSetting => {
      await queryClient.cancelQueries({ queryKey: ['role-settings'] });
      const previous = queryClient.getQueryData<RoleSettingsMap>(['role-settings']) || settings;

      const updated: RoleSettingsMap = {
        ...previous,
        [newSetting.categorization]: {
          ...(previous[newSetting.categorization] || DEFAULT_ROLE_SETTINGS.container),
          [newSetting.position]: newSetting.role_type,
        },
      };

      saveStoredSettings(updated);
      queryClient.setQueryData(['role-settings'], updated);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        saveStoredSettings(context.previous);
        queryClient.setQueryData(['role-settings'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['role-settings'] });
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetRoleSettingsApi,
    onMutate: async (categorization: string) => {
      await queryClient.cancelQueries({ queryKey: ['role-settings'] });
      const previous = queryClient.getQueryData<RoleSettingsMap>(['role-settings']) || settings;

      const updated: RoleSettingsMap = {
        ...previous,
        [categorization]: { ...DEFAULT_CATEGORY_SETTINGS },
      };

      saveStoredSettings(updated);
      queryClient.setQueryData(['role-settings'], updated);
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        saveStoredSettings(context.previous);
        queryClient.setQueryData(['role-settings'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['role-settings'] });
      queryClient.invalidateQueries({ queryKey: ['rotation-vessels'] });
    },
  });

  const setRoleSetting = (
    categorization: string,
    position: string,
    role_type: RoleClassification
  ) => {
    return mutation.mutateAsync({ categorization, position, role_type });
  };

  const resetRoleSettings = (categorization: string) => {
    return resetMutation.mutateAsync(categorization);
  };

  /**
   * Mengembalikan urutan tab posisi untuk Senior Rotation
   * Menampilkan posisi-posisi yang bertipe 'senior', terurut Dek lalu Mesin.
   */
  const getSeniorRoles = (categorization: string): string[] => {
    const catSettings = {
      ...DEFAULT_CATEGORY_SETTINGS,
      ...(settings[categorization] || {}),
    };

    const deckSenior = DECK_POSITIONS.filter(
      pos => catSettings[pos] === 'senior'
    );
    const engineSenior = ENGINE_POSITIONS.filter(
      pos => catSettings[pos] === 'senior'
    );

    return [...deckSenior, ...engineSenior];
  };

  /**
   * Mengembalikan urutan tab posisi untuk Junior Rotation
   * Menampilkan posisi-posisi yang bertipe 'junior', terurut Dek lalu Mesin.
   */
  const getJuniorRoles = (categorization: string): string[] => {
    const catSettings = {
      ...DEFAULT_CATEGORY_SETTINGS,
      ...(settings[categorization] || {}),
    };

    const deckJunior = DECK_POSITIONS.filter(
      pos => catSettings[pos] !== 'senior'
    );
    const engineJunior = ENGINE_POSITIONS.filter(
      pos => catSettings[pos] !== 'senior'
    );

    return [...deckJunior, ...engineJunior];
  };

  /**
   * Mengetahui klasifikasi role suatu posisi pada suatu kategori
   */
  const getPositionRole = (
    categorization: string,
    position: string
  ): RoleClassification => {
    const catSettings = {
      ...DEFAULT_CATEGORY_SETTINGS,
      ...(settings[categorization] || {}),
    };
    return (catSettings[position] as RoleClassification) || 'junior';
  };

  return {
    settings,
    isLoading,
    isPlaceholderData,
    error,
    refetch,
    hasAuthoritativeSettings,
    setRoleSetting,
    resetRoleSettings,
    isUpdating: mutation.isPending || resetMutation.isPending,
    getSeniorRoles,
    getJuniorRoles,
    getPositionRole,
  };
}
