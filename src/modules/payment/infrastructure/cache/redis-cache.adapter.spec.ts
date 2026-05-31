const redisClientMock = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn(() => redisClientMock);
});

import Redis from 'ioredis';
import { RedisCacheAdapter } from './redis-cache.adapter';

const RedisMock = Redis as unknown as jest.Mock;
const PLAN_CACHE_PREFIX = `${process.env.ENVIRONMENT ?? 'production'}_payment:plans`;

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new RedisCacheAdapter('redis://localhost:6379');
  });

  it('should create Redis client with provided URL', () => {
    expect(RedisMock).toHaveBeenCalledWith('redis://localhost:6379');
  });

  describe('get()', () => {
    it('should return parsed JSON when cache hit', async () => {
      redisClientMock.get.mockResolvedValue('{"foo":"bar"}');

      await expect(adapter.get<{ foo: string }>('key')).resolves.toEqual({
        foo: 'bar',
      });
      expect(redisClientMock.get).toHaveBeenCalledWith('key');
    });

    it('should return null when cache miss', async () => {
      redisClientMock.get.mockResolvedValue(null);

      await expect(adapter.get('missing')).resolves.toBeNull();
    });

    it('should return null when cached payload is invalid json', async () => {
      redisClientMock.get.mockResolvedValue('not-json');

      await expect(adapter.get('bad')).resolves.toBeNull();
    });
  });

  describe('set()', () => {
    it('should serialize value and set default ttl', async () => {
      await adapter.set('key', { foo: 'bar' });

      expect(redisClientMock.set).toHaveBeenCalledWith(
        'key',
        '{"foo":"bar"}',
        'EX',
        3600,
      );
    });

    it('should use provided ttl', async () => {
      await adapter.set('key', { foo: 'bar' }, 12);

      expect(redisClientMock.set).toHaveBeenCalledWith(
        'key',
        '{"foo":"bar"}',
        'EX',
        12,
      );
    });
  });

  it('should delete a single key', async () => {
    await adapter.del('key');
    expect(redisClientMock.del).toHaveBeenCalledWith('key');
  });

  it('should delete keys matching a pattern', async () => {
    redisClientMock.keys.mockResolvedValue(['a', 'b']);

    await adapter.delByPattern(`${PLAN_CACHE_PREFIX}:*`);

    expect(redisClientMock.keys).toHaveBeenCalledWith(`${PLAN_CACHE_PREFIX}:*`);
    expect(redisClientMock.del).toHaveBeenCalledWith('a', 'b');
  });

  it('should skip delete when pattern matches nothing', async () => {
    redisClientMock.keys.mockResolvedValue([]);

    await adapter.delByPattern(`${PLAN_CACHE_PREFIX}:*`);

    expect(redisClientMock.del).not.toHaveBeenCalled();
  });
});
