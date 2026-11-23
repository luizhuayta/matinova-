import { describe, expect, it } from 'vitest';
import { allowPublicMotion } from './public-motion';

describe('allowPublicMotion', () => {
  it('allows motion when the visitor has not opted out', () => {
    expect(allowPublicMotion(true, false, false, false)).toBe(true);
  });

  it('stops motion in edit mode, reduced motion, and a11y off', () => {
    expect(allowPublicMotion(true, true, false)).toBe(false);
    expect(allowPublicMotion(true, false, true)).toBe(false);
    expect(allowPublicMotion(true, false, false, true)).toBe(false);
    expect(allowPublicMotion(false, false, false)).toBe(false);
  });
});
