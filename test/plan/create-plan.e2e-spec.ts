import { INestApplication } from '@nestjs/common';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { httpServer } from '../common/utils/http-server.util';
import {
  adminHeader,
  mainWithMockAuth,
  userHeader,
} from '../common/utils/main-with-mock-auth.util';
import {
  ALL_PLANS_CACHE_KEY,
  captureRedisCommands,
} from '../common/utils/plan-cache-e2e.util';

describe('CreatePlanController (e2e)', () => {
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

  describe('POST /plans', () => {
    it('should create a plan successfully as admin', async () => {
      const payload = {
        name: 'VIP 1',
        durationMonths: 1,
        price: 99000,
        isActive: true,
      };

      expect(await redis.exists(ALL_PLANS_CACHE_KEY)).toBe(0);

      const cachedListBeforeCreate = await captureRedisCommands(
        redis,
        async () =>
          request(httpServer(app))
            .get('/code-payment-service/plans')
            .expect(200),
      );
      expect(cachedListBeforeCreate.commands).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`set ${ALL_PLANS_CACHE_KEY}`),
        ]),
      );
      expect(await redis.exists(ALL_PLANS_CACHE_KEY)).toBe(1);

      const response = await request(httpServer(app))
        .post('/code-payment-service/plans')
        .set(adminHeader())
        .send(payload)
        .expect(201);

      const body = response.body as { data: { name: string } };
      expect(body.data).toBeDefined();
      expect(body.data.name).toBe(payload.name);

      expect(await redis.exists(ALL_PLANS_CACHE_KEY)).toBe(0);

      const cachedListAfterCreate = await captureRedisCommands(
        redis,
        async () =>
          request(httpServer(app))
            .get('/code-payment-service/plans')
            .expect(200),
      );
      expect(cachedListAfterCreate.commands).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`set ${ALL_PLANS_CACHE_KEY}`),
        ]),
      );
    });

    it('should return 403 as regular user', async () => {
      await request(httpServer(app))
        .post('/code-payment-service/plans')
        .set(userHeader())
        .send({ name: 'Test', durationMonths: 1, price: 1000 })
        .expect(403);
    });
  });
});
