import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { httpServer } from '../common/utils/http-server.util';
import { mainWithMockAuth } from '../common/utils/main-with-mock-auth.util';

describe('PaymentReturnController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET/POST /subscriptions/payment-return/:provider', () => {
    it('should handle VNPay return (GET)', async () => {
      const response = await request(httpServer(app))
        .get('/code-payment-service/subscriptions/payment-return/vnpay')
        .query({ vnp_ResponseCode: '00', vnp_TxnRef: '789' })
        .expect(200);

      const body = response.body as { success: boolean };
      expect(body.success).toBeDefined();
    });
  });
});
