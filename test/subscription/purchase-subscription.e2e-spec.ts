import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { httpServer } from '../common/utils/http-server.util';
import {
  adminHeader,
  mainWithMockAuth,
  userHeader,
} from '../common/utils/main-with-mock-auth.util';

describe('PurchaseSubscriptionController (e2e)', () => {
  let app: INestApplication;
  let planId: string;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);

    // Create a plan to purchase
    const res = await request(httpServer(app))
      .post('/code-payment-service/plans')
      .set(adminHeader())
      .send({ name: 'Subscription Plan', durationMonths: 1, price: 50000 });

    const body = res.body as { data: { id: string } };
    planId = body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /subscriptions/purchase', () => {
    it('should initiate purchase successfully as user', async () => {
      const response = await request(httpServer(app))
        .post('/code-payment-service/subscriptions/purchase')
        .set(userHeader())
        .send({
          plan_id: planId,
        });

      // Status could be 201 or 200 depending on implementation
      expect([200, 201]).toContain(response.status);
      const body = response.body as { data: { payment_url: string } };
      expect(body.data.payment_url).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      await request(httpServer(app))
        .post('/code-payment-service/subscriptions/purchase')
        .set(userHeader())
        .send({})
        .expect(400);
    });
  });
});
