import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  mainWithMockAuth,
  adminHeader,
  userHeader,
} from '../common/utils/main-with-mock-auth.util';

describe('CreatePlanController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /plans', () => {
    it('should create a plan successfully as admin', async () => {
      const payload = {
        name: 'VIP 1 tháng',
        durationMonths: 1,
        price: 99000,
        isActive: true,
      };

      const response = await request(app.getHttpServer() as unknown as string)
        .post('/code-payment-service/plans')
        .set(adminHeader())
        .send(payload)
        .expect(201);

      const body = response.body as { data: { name: string } };
      expect(body.data).toBeDefined();
      expect(body.data.name).toBe(payload.name);
    });

    it('should return 403 as regular user', async () => {
      await request(app.getHttpServer() as unknown as string)
        .post('/code-payment-service/plans')
        .set(userHeader())
        .send({ name: 'Test', durationMonths: 1, price: 1000 })
        .expect(403);
    });
  });
});
