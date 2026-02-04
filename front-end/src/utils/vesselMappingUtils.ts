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
