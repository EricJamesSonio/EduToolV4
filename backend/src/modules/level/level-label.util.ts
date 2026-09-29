// Single source of truth for turning a department type + a plain number
// into the human-readable level label. Used by createOne, addNextLevel,
// and bulkGenerate so all three code paths agree.

const YEAR_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

export function getLevelLabel(programType: string, n: number): string {
  switch (programType) {
    case 'daycare':
      return `Daycare ${n}`;
    case 'kinder':
      return `Kinder ${n}`;
    case 'elementary':
      return `Grade ${n}`;
    case 'jhs':
      return `Grade ${n + 6}`; // n=1 -> Grade 7 ... n=4 -> Grade 10
    case 'shs':
      return `Grade ${n + 10}`; // n=1 -> Grade 11, n=2 -> Grade 12
    case 'college': {
      const ordinal = YEAR_ORDINALS[n - 1] ?? `${n}th`;
      return `${ordinal} Year`;
    }
    case 'custom':
    default:
      return `${n}`;
  }
}

/**
 * Best-effort reverse mapping — used only to prefill a "rename" control with
 * the number that produced an existing label. Not used for creating levels.
 */
export function extractLevelNumber(programType: string, name: string): number {
  const match = name.match(/\d+/);
  const raw = match ? parseInt(match[0], 10) : 1;
  switch (programType) {
    case 'jhs':
      return Math.max(1, raw - 6);
    case 'shs':
      return Math.max(1, raw - 10);
    default:
      return Math.max(1, raw);
  }
}