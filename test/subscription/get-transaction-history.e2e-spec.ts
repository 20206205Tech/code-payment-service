import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { httpServer } from '../common/utils/http-server.util';
import {
  mainWithMockAuth,
  userHeader,
} from '../common/utils/main-with-mock-auth.util';

describe('GetTransactionHistoryController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /subscriptions/history', () => {
    it('should return transaction history for user', async () => {
      const response = await request(httpServer(app))
        .get('/code-payment-service/subscriptions/history')
        .set(userHeader())
        .expect(200);

      const body = response.body as {
        success: boolean;
        data: { items: any[]; total: number };
      };
      expect(body.message).toBeDefined();
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(typeof body.data.total).toBe('number');
    });

    it('should support pagination', async () => {
      const response = await request(httpServer(app))
        .get('/code-payment-service/subscriptions/history?skip=0&limit=5')
        .set(userHeader())
        .expect(200);

      const body = response.body as { data: { items: any[]; total: number } };
      expect(body.data.items.length).toBeLessThanOrEqual(5);
    });
  });
});
