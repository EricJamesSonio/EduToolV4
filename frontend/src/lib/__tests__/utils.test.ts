import { cn, cardGridClass, cardListGridClass, pickCardColor } from '../utils';

describe('cn', () => {
  it('merges class names and deduplicates tailwind', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    expect(cn('px-2', false, null, undefined, 'py-1')).toBe('px-2 py-1');
    // tailwind-merge should dedup conflicting classes — last wins
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional and array inputs', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
    expect(cn({ 'px-2': true, 'hidden': false })).toBe('px-2');
  });
});

describe('cardGridClass', () => {
  it('returns 1 col for count <=1', () => {
    expect(cardGridClass(0)).toContain('grid-cols-1');
    expect(cardGridClass(1)).toContain('grid-cols-1');
    expect(cardGridClass(1)).toContain('gap-3');
  });
  it('returns 2->3 cols for 2-3 items', () => {
    expect(cardGridClass(2)).toBe('grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4');
    expect(cardGridClass(3)).toBe('grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4');
  });
  it('returns 2->3->4 cols for >3 items', () => {
    expect(cardGridClass(4)).toBe('grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4');
    expect(cardGridClass(10)).toContain('xl:grid-cols-4');
  });
});

describe('cardListGridClass', () => {
  it('returns fixed 2->3 grid', () => {
    expect(cardListGridClass()).toBe('grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3');
  });
});

describe('pickCardColor', () => {
  it('returns deterministic color for same id', () => {
    expect(pickCardColor('test-id')).toBe(pickCardColor('test-id'));
    expect(pickCardColor('org-1')).toBe(pickCardColor('org-1'));
  });
  it('returns a known CARD_COLORS value', () => {
    const known = ['icon-structure','icon-utility','icon-educator','icon-analytics','icon-share','icon-danger','icon-warning','icon-credential','icon-security','icon-people'];
    expect(known).toContain(pickCardColor('any-id'));
    expect(known).toContain(pickCardColor('another-id'));
  });
  it('distributes different ids (not all same)', () => {
    const colors = new Set(['a','b','c','d','e','f','g','h','i','j','k'].map(pickCardColor));
    expect(colors.size).toBeGreaterThan(1);
  });
  it('handles empty string (hash 0 -> first color)', () => {
    expect(pickCardColor('')).toBe('icon-structure');
  });
});
