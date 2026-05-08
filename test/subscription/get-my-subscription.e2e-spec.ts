import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  mainWithMockAuth,
  userHeader,
} from '../common/utils/main-with-mock-auth.util';

describe('GetMySubscriptionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /subscriptions', () => {
    it('should return user subscription successfully', async () => {
      const response = await request(app.getHttpServer() as unknown as string)
        .get('/code-payment-service/subscriptions')
        .set(userHeader())
        .expect(200);

      const body = response.body as { success: boolean; data: any };
      expect(body.message).toBeDefined();
      expect(body.data).toBeDefined();
    });

    it('should return 403 when not authenticated', async () => {
      await request(app.getHttpServer() as unknown as string)
        .get('/code-payment-service/subscriptions')
        .expect(403);
    });
  });
});
