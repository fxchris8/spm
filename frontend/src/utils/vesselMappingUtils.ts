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

    // BC (Barge-Crane) mappings
    bc_nakhoda: { type: 'senior', part: 'deck', vessel: 'F' },
    bc_KKM: { type: 'senior', part: 'engine', vessel: 'G' },
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
    container: 'Container',
    manalagi: 'Manalagi',
    bc: 'BC (Barge Crane)',
  };
  return formatMap[categorization] || categorization;
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
    .map(key => {
      const match = key.match(/rotation(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
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
): { renumberedGroups: Record<string, string[]>; renames: Record<string, string> } {
  const prefix = `${categorization}_rotation`;

  const sortedEntries = Object.entries(groups)
    .filter(([key]) => key.startsWith(prefix))
    .sort(([a], [b]) => {
      return (
        parseInt(a.replace(prefix, ''), 10) -
        parseInt(b.replace(prefix, ''), 10)
      );
    });

  const renumberedGroups: Record<string, string[]> = {};
  const renames: Record<string, string> = {};

  sortedEntries.forEach(([oldKey, ships], index) => {
    const newKey = `${prefix}${index + 1}`;
    renumberedGroups[newKey] = ships;
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
 * Linked positions for container categorization:
 * Nakhoda <-> Mualim I (same vessel 'D')
 * KKM <-> Masinis II (same vessel 'E')
 */
const CONTAINER_LINKED_POSITIONS: Record<string, string> = {
  nakhoda: 'mualimI',
  mualimI: 'nakhoda',
  KKM: 'masinisII',
  masinisII: 'KKM',
};

/**
 * Linked positions for manalagi categorization:
 * Nakhoda <-> Mualim I (same vessel 'F')
 * KKM <-> Masinis II (same vessel 'G')
 */
const MANALAGI_LINKED_POSITIONS: Record<string, string> = {
  nakhoda: 'mualimI',
  mualimI: 'nakhoda',
  KKM: 'masinisII',
  masinisII: 'KKM',
};

/**
 * Get the linked/paired position for a given categorization + position.
 * Returns null if no linked position exists.
 */
export function getLinkedPosition(
  categorization: string,
  position: string
): string | null {
  if (categorization === 'container')
    return CONTAINER_LINKED_POSITIONS[position] || null;
  if (categorization === 'manalagi')
    return MANALAGI_LINKED_POSITIONS[position] || null;
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
