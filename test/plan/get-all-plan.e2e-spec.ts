import { INestApplication } from '@nestjs/common';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { httpServer } from '../common/utils/http-server.util';
import { mainWithMockAuth } from '../common/utils/main-with-mock-auth.util';

const ALL_PLANS_CACHE_KEY = 'payment:plans:active:0:100';

async function captureRedisCommands<T>(
  redis: Redis,
  action: () => Promise<T>,
): Promise<{ result: T; commands: string[] }> {
  const commands: string[] = [];
  const monitor = await redis.monitor();
  monitor.on('monitor', (_time: number, args: string[]) => {
    commands.push(args.join(' ').toLowerCase());
  });

  try {
    const result = await action();
    return { result, commands };
  } finally {
    monitor.disconnect();
  }
}

describe('GetAllPlanController (e2e)', () => {
  let app: INestApplication;
  let redis: Redis;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
    redis = new Redis(process.env.REDIS_URL as string);
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
    await app.close();
  });

  describe('GET /plans', () => {
    it('should populate Redis on cache miss and reuse it on cache hit', async () => {
      expect(await redis.exists(ALL_PLANS_CACHE_KEY)).toBe(0);

      const firstCall = await captureRedisCommands(redis, async () =>
        request(httpServer(app)).get('/code-payment-service/plans').expect(200),
      );

      expect(await redis.exists(ALL_PLANS_CACHE_KEY)).toBe(1);
      expect(firstCall.commands).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`get ${ALL_PLANS_CACHE_KEY}`),
          expect.stringContaining(`set ${ALL_PLANS_CACHE_KEY}`),
        ]),
      );

      const secondCall = await captureRedisCommands(redis, async () =>
        request(httpServer(app)).get('/code-payment-service/plans').expect(200),
      );

      expect(secondCall.commands).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`get ${ALL_PLANS_CACHE_KEY}`),
        ]),
      );
      expect(
        secondCall.commands.some((command) =>
          command.startsWith(`set ${ALL_PLANS_CACHE_KEY}`),
        ),
      ).toBe(false);

      const body = secondCall.result.body as { data: any[] };
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
