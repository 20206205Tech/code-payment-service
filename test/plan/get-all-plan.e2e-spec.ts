import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { mainWithMockAuth } from '../common/utils/main-with-mock-auth.util';

describe('GetAllPlanController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /plans', () => {
    it('should return all plans (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/code-payment-service/plans')
        .expect(200);

      const body = response.body as { data: any[] };
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
