import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  mainWithMockAuth,
  adminHeader,
} from '../common/utils/main-with-mock-auth.util';

describe('GetDetailPlanController (e2e)', () => {
  let app: INestApplication;
  let planId: string;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);

    // Create a plan to get detail from
    const res = await request(app.getHttpServer() as unknown as string)
      .post('/code-payment-service/plans')
      .set(adminHeader())
      .send({ name: 'Detail Test', durationMonths: 1, price: 50000 });

    const body = res.body as { data: { id: string } };
    planId = body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /plans/:id', () => {
    it('should return plan details', async () => {
      const response = await request(app.getHttpServer() as unknown as string)
        .get(`/code-payment-service/plans/${planId}`)
        .expect(200);

      const body = response.body as { data: { id: string; name: string } };
      expect(body.data.id).toBe(planId);
      expect(body.data.name).toBe('Detail Test');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer() as unknown as string)
        .get('/code-payment-service/plans/invalid-uuid')
        .expect(400);
    });
  });
});
