import { cacheKey } from '../../utils/cache';

describe('utils/cache cacheKey', () => {
  it('produces stable keys regardless of query order', () => {
    const k1 = cacheKey({ prefix: 'p', path: '/x', query: { b: 2, a: 1 }, userId: '42' });
    const k2 = cacheKey({ prefix: 'p', path: '/x', query: { a: 1, b: 2 }, userId: '42' });
    expect(k1).toBe(k2);
    expect(k1).toContain('p:u:42:/x?');
  });
});

