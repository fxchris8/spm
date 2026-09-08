// Utility functions for vessel management mapping and helpers

export interface HiddenFields {
  type: 'senior' | 'junior';
  part: 'deck' | 'engine';
  vessel: 'D' | 'E' | 'F' | 'G';
}

/**
 * Get hidden fields (type, part, vessel) based on categorization and position selection
 * This mapping is based on business logic to simplify user experience
 */
export function getHiddenFieldsFromSelection(
  categorization: string,
  position: string
): HiddenFields | null {
  const key = `${categorization}_${position}`;

  const mappings: Record<string, HiddenFields> = {
    // Container mappings
    container_nakhoda: { type: 'senior', part: 'deck', vessel: 'D' },
    container_mualimI: { type: 'senior', part: 'deck', vessel: 'D' },
    container_KKM: { type: 'senior', part: 'engine', vessel: 'E' },
    container_masinisII: { type: 'senior', part: 'engine', vessel: 'E' },
    container_mualimII: { type: 'junior', part: 'deck', vessel: 'D' },
    container_mualimIII: { type: 'junior', part: 'deck', vessel: 'D' },
    container_masinisIII: { type: 'junior', part: 'engine', vessel: 'E' },
    container_masinisIV: { type: 'junior', part: 'engine', vessel: 'E' },

    // Manalagi mappings
    manalagi_nakhoda: { type: 'senior', part: 'deck', vessel: 'F' },
    manalagi_KKM: { type: 'senior', part: 'engine', vessel: 'G' },
    manalagi_mualimI: { type: 'senior', part: 'deck', vessel: 'F' },
    manalagi_masinisII: { type: 'senior', part: 'engine', vessel: 'G' },
    manalagi_mualimII: { type: 'junior', part: 'deck', vessel: 'F' },
    manalagi_mualimIII: { type: 'junior', part: 'deck', vessel: 'F' },
    manalagi_masinisIII: { type: 'junior', part: 'engine', vessel: 'G' },
    manalagi_masinisIV: { type: 'junior', part: 'engine', vessel: 'G' },

    // BC (Barge-Crane) mappings
    bc_nakhoda: { type: 'senior', part: 'deck', vessel: 'F' },
    bc_KKM: { type: 'senior', part: 'engine', vessel: 'G' },
    bc_mualimI: { type: 'senior', part: 'deck', vessel: 'F' },
    bc_masinisII: { type: 'senior', part: 'engine', vessel: 'G' },
    bc_mualimII: { type: 'junior', part: 'deck', vessel: 'F' },
    bc_mualimIII: { type: 'junior', part: 'deck', vessel: 'F' },
    bc_masinisIII: { type: 'junior', part: 'engine', vessel: 'G' },
    bc_masinisIV: { type: 'junior', part: 'engine', vessel: 'G' },
  };

  return mappings[key] || null;
}

/**
 * Format position for display (convert camelCase to readable format)
 */
export function formatPositionDisplay(position: string): string {
  const formatMap: Record<string, string> = {
    nakhoda: 'Nahkoda',
    KKM: 'KKM',
    mualimI: 'Mualim I',
    mualimII: 'Mualim II',
    mualimIII: 'Mualim III',
    masinisII: 'Masinis II',
    masinisIII: 'Masinis III',
    masinisIV: 'Masinis IV',
  };
  return formatMap[position] || position;
}

/**
 * Format categorization for display
 */
export function formatCategorizationDisplay(categorization: string): string {
  const formatMap: Record<string, string> = {
    container: 'Container, Free Cargo, RORO',
    manalagi: 'Manalagi',
    bc: 'BC, TB, TK, Service',
  };
  return formatMap[categorization] || categorization;
}

/**
 * Extract rotation number from group key (e.g., "container_rotation2" -> 2)
 */
export function getRotationNumber(groupKey: string): number {
  return parseInt(groupKey.match(/rotation(\d+)$/)?.[1] || '0', 10);
}

/**
 * Sort group keys by their rotation number in ascending order
 */
export function sortGroupKeys(keys: string[] | Record<string, any>): string[] {
  const keyList = Array.isArray(keys) ? keys : Object.keys(keys);
  return [...keyList].sort((a, b) => getRotationNumber(a) - getRotationNumber(b));
}

/**
 * Format group key to readable group name (e.g., "container_rotation1" -> "Group 1")
 */
export function formatGroupName(groupKey: string): string {
  const match = groupKey.match(/rotation(\d+)$/);
  return match ? `Group ${match[1]}` : groupKey;
}

/**
 * Generate next group key based on existing groups
 * Pattern: {categorization}_rotation{number}
 * Auto-increments based on existing groups for the same categorization
 */
export function generateNextGroupKey(
  existingGroups: Record<string, string[]>,
  categorization: string
): string {
  // Extract numbers from existing group keys with the same categorization
  const numbers = Object.keys(existingGroups)
    .filter(key => key.startsWith(`${categorization}_rotation`))
    .map(key => getRotationNumber(key))
    .filter(num => !isNaN(num) && num > 0);

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${categorization}_rotation${nextNumber}`;
}

/**
 * Re-number groups sequentially after a deletion.
 * Returns { renumberedGroups, renames } where renames maps old keys → new keys
 * (only entries where the key actually changed).
 *
 * Example:
 *   input:  { container_rotation1: [...], container_rotation3: [...] }
 *   output: { renumberedGroups: { container_rotation1: [...], container_rotation2: [...] },
 *             renames: { container_rotation3: 'container_rotation2' } }
 */
export function renumberGroups(
  groups: Record<string, string[]>,
  categorization: string
): {
  renumberedGroups: Record<string, string[]>;
  renames: Record<string, string>;
} {
  // Separate keys belonging to this categorization from others
  const prefix = `${categorization}_rotation`;
  const relevantKeys = Object.keys(groups)
    .filter(key => key.startsWith(prefix))
    .sort((a, b) => getRotationNumber(a) - getRotationNumber(b));

  const otherKeys = Object.keys(groups).filter(key => !key.startsWith(prefix));

  const renumberedGroups: Record<string, string[]> = {};
  const renames: Record<string, string> = {};

  // Preserve untouched keys from other categorizations
  for (const key of otherKeys) {
    renumberedGroups[key] = groups[key];
  }

  // Re-number relevant keys sequentially: 1, 2, 3, ...
  relevantKeys.forEach((oldKey, idx) => {
    const newKey = `${prefix}${idx + 1}`;
    renumberedGroups[newKey] = groups[oldKey];
    if (oldKey !== newKey) {
      renames[oldKey] = newKey;
    }
  });

  return { renumberedGroups, renames };
}

/**
 * Merge two rename maps, chaining renames so that intermediate keys are resolved.
 * e.g. if existingRenames has { rotation4 → rotation3 } and newRenames has { rotation3 → rotation2 },
 * the final map becomes { rotation4 → rotation2, rotation3 → rotation2 }.
 */
export function mergeRenames(
  existing: Record<string, string>,
  incoming: Record<string, string>
): Record<string, string> {
  const merged: Record<string, string> = { ...existing };

  // Apply incoming renames and chain with existing
  for (const [oldKey, newKey] of Object.entries(incoming)) {
    // Update any existing entry that points to oldKey
    for (const [k, v] of Object.entries(merged)) {
      if (v === oldKey) {
        merged[k] = newKey;
      }
    }
    // If this oldKey has its own rename, chain it
    merged[oldKey] = newKey;
  }

  // Clean up entries where old === new (no-op renames)
  for (const k of Object.keys(merged)) {
    if (merged[k] === k) {
      delete merged[k];
    }
  }

  return merged;
}

/**
 * Default linked positions mapping for crew rotation (applies across container, manalagi, and bc):
 * Nakhoda <-> Mualim I (same deck vessel)
 * KKM <-> Masinis II (same engine vessel)
 * Mualim II <-> Mualim III (same deck vessel)
 * Masinis III <-> Masinis IV (same engine vessel)
 */
export const DEFAULT_LINKED_POSITIONS: Record<string, string> = {
  nakhoda: 'mualimI',
  mualimI: 'nakhoda',
  KKM: 'masinisII',
  masinisII: 'KKM',
  mualimII: 'mualimIII',
  mualimIII: 'mualimII',
  masinisIII: 'masinisIV',
  masinisIV: 'masinisIII',
};

// Aliases for backwards compatibility
export const CONTAINER_LINKED_POSITIONS = DEFAULT_LINKED_POSITIONS;
export const MANALAGI_LINKED_POSITIONS = DEFAULT_LINKED_POSITIONS;
export const BC_LINKED_POSITIONS = DEFAULT_LINKED_POSITIONS;

/**
 * Get the linked/paired position for a given categorization + position.
 * Returns null if no linked position exists.
 */
export function getLinkedPosition(
  categorization: string,
  position: string
): string | null {
  if (['container', 'manalagi', 'bc'].includes(categorization)) {
    return DEFAULT_LINKED_POSITIONS[position] || null;
  }
  return null;
}

/**
 * Validate if a categorization + position combination is valid
 */
export function isValidCombination(
  categorization: string,
  position: string
): boolean {
  return getHiddenFieldsFromSelection(categorization, position) !== null;
}

/**
 * Get all available positions
 */
export function getAllPositions(): string[] {
  return [
    'nakhoda',
    'KKM',
    'mualimI',
    'masinisII',
    'mualimII',
    'masinisIII',
    'mualimIII',
    'masinisIV',
  ];
}

/**
 * Get all available categorizations
 */
export function getAllCategorizations(): string[] {
  return ['container', 'manalagi', 'bc'];
}

/**
 * Mapping of categorization to relevant vesseltypeid from ship_particular table
 */
export const VESSEL_TYPE_IDS_BY_CATEGORY: Record<string, number[]> = {
  container: [3, 1, 5, 16],
  manalagi: [14],
  bc: [12, 13, 15, -1],
};
