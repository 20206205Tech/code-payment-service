import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
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
      const response = await request(app.getHttpServer())
        .get('/code-payment-service/subscriptions/history')
        .set(userHeader())
        .expect(200);

      const body = response.body as { success: boolean; data: any[] };
      expect(body.message).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/code-payment-service/subscriptions/history?skip=0&limit=5')
        .set(userHeader())
        .expect(200);

      const body = response.body as { data: any[] };
      expect(body.data.length).toBeLessThanOrEqual(5);
    });
  });
});
