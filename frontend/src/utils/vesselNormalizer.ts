/**
 * Module for normalizing vessel names and flexible matching between
 * seaman last_location, database vessel configurations, search inputs, and central ship particulars.
 * Ported from backend/utils/vessel_normalizer.py
 */

// Regex pattern to match common ship prefixes with/without dot and space(s)
const PREFIX_PATTERN =
  /^(KM\.?|TB\.?|MT\.?|TK\.?|BC\.?|MV\.?|KMP\.?|BG\.?|KL\.?|SERVICE\s+BOAT|SERVICE)\s+/i;

// Canonical alias mapping for spelling variations between legacy inputs and master ship_particular
export const VESSEL_ALIASES: Record<string, string> = {
  'MULIANIM': 'MULI ANIM',
  'MULI ANIM': 'MULI ANIM',
  'ORIENTAL SAMUDERA': 'ORIENTAL SAMUDRA',
  'ORIENTAL SAMUDRA': 'ORIENTAL SAMUDRA',
  'TENYO MARU': 'TENYO',
  'TENYO': 'TENYO',
  'ALPA SATU': 'ALPHA',
  'ALPHA SATU': 'ALPHA',
  'ALPHA': 'ALPHA',
  'NELLY A 100': 'NELLY A100',
  'NELLY A100': 'NELLY A100',
  'SPIL RAHAYU': 'SPIL HAYU',
  'SPIL HAYU': 'SPIL HAYU',
};

/**
 * Strip ship type prefixes (KM., TB., MT., TK., BC., MV., etc.),
 * collapse whitespace, uppercase, and resolve known aliases.
 *
 * Examples:
 * - "KM. MERATUS JAYAPURA" -> "MERATUS JAYAPURA"
 * - "KM MERATUS JAYAPURA"  -> "MERATUS JAYAPURA"
 * - "TB. ALPHA"            -> "ALPHA"
 * - "KM. MULIANIM"         -> "MULI ANIM"
 * - "KM. ORIENTAL SAMUDERA"-> "ORIENTAL SAMUDRA"
 * - "BC. TENYO MARU"       -> "TENYO"
 */
export function normalizeVesselName(name: string | null | undefined): string {
  if (!name) return '';

  const nameStr = String(name).trim();
  if (!nameStr) return '';

  // Strip prefix using regex
  let cleaned = nameStr.replace(PREFIX_PATTERN, '').trim();

  // Collapse multi-spaces & uppercase
  cleaned = cleaned.replace(/\s+/g, ' ').toUpperCase();

  // Resolve canonical alias if present
  if (VESSEL_ALIASES[cleaned]) {
    cleaned = VESSEL_ALIASES[cleaned];
  }

  return cleaned;
}

/**
 * Flexible matching between user search/query and target vessel name.
 * Handles:
 * 1. Plain case-insensitive substring match
 * 2. Normalized prefix-stripped match (exact or substring)
 * 3. Space-insensitive match (e.g. "MULIANIM" vs "MULI ANIM")
 */
export function isVesselMatch(
  query: string | null | undefined,
  target: string | null | undefined
): boolean {
  if (!query || !target) return false;

  const rawQuery = String(query).trim().toUpperCase();
  const rawTarget = String(target).trim().toUpperCase();

  if (!rawQuery || !rawTarget) return false;

  // 1. Direct match or direct substring
  if (rawTarget === rawQuery || rawTarget.includes(rawQuery) || rawQuery.includes(rawTarget)) {
    return true;
  }

  // 2. Normalized match
  const normQuery = normalizeVesselName(rawQuery);
  const normTarget = normalizeVesselName(rawTarget);

  if (normQuery && normTarget) {
    if (normTarget === normQuery || normTarget.includes(normQuery) || normQuery.includes(normTarget)) {
      return true;
    }

    // 3. Space-stripped match (handles MULIANIM vs MULI ANIM, NELLY A100 vs NELLY A 100)
    const compactQuery = normQuery.replace(/\s+/g, '');
    const compactTarget = normTarget.replace(/\s+/g, '');
    if (
      compactTarget === compactQuery ||
      compactTarget.includes(compactQuery) ||
      compactQuery.includes(compactTarget)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Build a Set containing both raw and normalized variations for quick lookup.
 */
export function buildNormalizedVesselSet(
  names: Iterable<string | null | undefined>
): Set<string> {
  const result = new Set<string>();
  for (const name of names) {
    if (name) {
      const upper = String(name).trim().toUpperCase();
      if (upper) result.add(upper);

      const norm = normalizeVesselName(upper);
      if (norm) {
        result.add(norm);
        // Also add space-compact version
        result.add(norm.replace(/\s+/g, ''));
      }
    }
  }
  return result;
}
