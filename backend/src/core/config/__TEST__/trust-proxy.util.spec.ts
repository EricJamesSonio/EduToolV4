import { resolveTrustProxy } from '../trust-proxy.util';

describe('resolveTrustProxy', () => {
  it('defaults to 1 hop in production when unset', () => {
    expect(resolveTrustProxy(undefined, 'production')).toBe(1);
    expect(resolveTrustProxy('', 'production')).toBe(1);
    expect(resolveTrustProxy('   ', 'production')).toBe(1);
  });

  it('defaults to false outside production so local dev ignores spoofable headers', () => {
    expect(resolveTrustProxy(undefined, 'development')).toBe(false);
    expect(resolveTrustProxy('', 'development')).toBe(false);
    expect(resolveTrustProxy(undefined, 'test')).toBe(false);
  });

  it('parses a non-negative integer hop count', () => {
    expect(resolveTrustProxy('0', 'production')).toBe(0);
    expect(resolveTrustProxy('1', 'development')).toBe(1);
    expect(resolveTrustProxy('3', 'production')).toBe(3);
  });

  it('parses true/false case-insensitively', () => {
    expect(resolveTrustProxy('true', 'production')).toBe(true);
    expect(resolveTrustProxy('TRUE', 'production')).toBe(true);
    expect(resolveTrustProxy('false', 'production')).toBe(false);
    expect(resolveTrustProxy('False', 'development')).toBe(false);
  });

  it('passes an IP/subnet list through as a string', () => {
    expect(resolveTrustProxy('10.0.0.1', 'production')).toBe('10.0.0.1');
    expect(resolveTrustProxy('10.0.0.1,192.168.0.0/16', 'production')).toBe(
      '10.0.0.1,192.168.0.0/16',
    );
  });

  it('trims surrounding whitespace before interpreting the value', () => {
    expect(resolveTrustProxy('  2  ', 'production')).toBe(2);
    expect(resolveTrustProxy('  true  ', 'production')).toBe(true);
  });
});
