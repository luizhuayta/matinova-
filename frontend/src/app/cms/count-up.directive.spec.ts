import { describe, expect, it } from 'vitest';
import { formatCountUp, parseCountUp } from './count-up.directive';

describe('parseCountUp / formatCountUp', () => {
  it('animates an integer preserving a suffix', () => {
    const parts = parseCountUp('30+');
    expect(parts).toMatchObject({ target: 30, prefix: '', suffix: '+', groupSeparator: '' });
    expect(formatCountUp(parts!, 0)).toBe('0+');
    expect(formatCountUp(parts!, 30)).toBe('30+');
  });

  it('animates comma thousands preserving the comma', () => {
    const parts = parseCountUp('4,127');
    expect(parts).toMatchObject({ target: 4127, prefix: '', suffix: '', groupSeparator: ',' });
    expect(formatCountUp(parts!, 0)).toBe('0');
    expect(formatCountUp(parts!, 1276)).toBe('1,276');
    expect(formatCountUp(parts!, 4127)).toBe('4,127');
  });

  it('animates a plain integer', () => {
    const parts = parseCountUp('5');
    expect(parts).toMatchObject({ target: 5, prefix: '', suffix: '' });
    expect(formatCountUp(parts!, 5)).toBe('5');
  });

  it('animates only the first number and preserves a numeric suffix', () => {
    const parts = parseCountUp('24/7');
    expect(parts).toMatchObject({ target: 24, prefix: '', suffix: '/7' });
    expect(formatCountUp(parts!, 0)).toBe('0/7');
    expect(formatCountUp(parts!, 24)).toBe('24/7');
  });

  it('returns null for free text without a number', () => {
    expect(parseCountUp('Soporte continuo')).toBeNull();
  });

  it('animates dot thousands preserving the dot', () => {
    const parts = parseCountUp('1.500');
    expect(parts).toMatchObject({ target: 1500, prefix: '', suffix: '', groupSeparator: '.' });
    expect(formatCountUp(parts!, 1250)).toBe('1.250');
    expect(formatCountUp(parts!, 1500)).toBe('1.500');
  });

  it('preserves a non numeric prefix', () => {
    const parts = parseCountUp('US$ 1,200+');
    expect(parts).toMatchObject({ target: 1200, prefix: 'US$ ', suffix: '+', groupSeparator: ',' });
    expect(formatCountUp(parts!, 1200)).toBe('US$ 1,200+');
  });
});
