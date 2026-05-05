import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  mainWithMockAuth,
  adminHeader,
} from '../common/utils/main-with-mock-auth.util';

describe('ManualActivateTransactionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /subscriptions/manual-activate/:id', () => {
    it('should return 404 for non-existent transaction', async () => {
      await request(app.getHttpServer() as unknown as string)
        .post(
          '/code-payment-service/subscriptions/manual-activate/123e4567-e89b-42d3-a456-426614174999',
        )
        .set(adminHeader())
        .expect(400);
    });

    it('should return 403 as regular user', async () => {
      await request(app.getHttpServer() as unknown as string)
        .post('/code-payment-service/subscriptions/manual-activate/some-id')
        .set({
          'X-Test-User': JSON.stringify({
            userId: 'u1',
            role: 'authenticated',
          }),
        })
        .expect(403);
    });
  });
});
