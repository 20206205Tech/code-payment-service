import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  adminHeader,
  mainWithMockAuth,
} from '../common/utils/main-with-mock-auth.util';

describe('ArchivePlanController (e2e)', () => {
  let app: INestApplication;
  let planId: string;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);

    // Create a plan to archive
    const res = await request(app.getHttpServer())
      .post('/code-payment-service/plans')
      .set(adminHeader())
      .send({ name: 'To Archive', durationMonths: 1, price: 50000 });

    const body = res.body as { data: { id: string } };
    planId = body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('DELETE /plans/:id', () => {
    it('should archive plan successfully as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/code-payment-service/plans/${planId}`)
        .set(adminHeader())
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/code-payment-service/plans')
        .expect(200);

      const body = response.body as { data: Array<{ id: string }> };
      expect(body.data.some((plan) => plan.id === planId)).toBe(false);
    });
  });
});
