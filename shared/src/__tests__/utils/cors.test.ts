import { parseAllowedOrigins, corsOriginFn, socketCorsOrigin } from '../../utils/cors';

describe('utils/cors', () => {
  it('parses comma-separated origins', () => {
    expect(parseAllowedOrigins('http://a.com, http://b.com')).toEqual(['http://a.com', 'http://b.com']);
  });

  it('allows wildcard', (done) => {
    const fn = corsOriginFn(['*']);
    fn('http://whatever.com', (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it('rejects disallowed origin', (done) => {
    const fn = corsOriginFn(['http://allowed.com']);
    fn('http://blocked.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  it('socketCorsOrigin returns * for wildcard', () => {
    expect(socketCorsOrigin(['*'])).toBe('*');
    expect(socketCorsOrigin(['http://a'])).toEqual(['http://a']);
  });
});

