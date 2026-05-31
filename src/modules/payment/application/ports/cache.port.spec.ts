import { CACHE_PORT } from './cache.port';

describe('CACHE_PORT', () => {
  it('should expose a symbol token', () => {
    expect(typeof CACHE_PORT).toBe('symbol');
    expect(CACHE_PORT.description).toBe('CACHE_PORT');
  });
});
