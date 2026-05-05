import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { mainWithMockAuth } from '../common/utils/main-with-mock-auth.util';

describe('PaymentCallbackController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await mainWithMockAuth(AppModule);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET/POST /subscriptions/payment-callback/:provider', () => {
    it('should handle VNPay callback (GET)', async () => {
      const response = await request(app.getHttpServer() as unknown as string)
        .get('/code-payment-service/subscriptions/payment-callback/vnpay')
        .query({ vnp_ResponseCode: '00', vnp_TxnRef: '123' })
        .expect(200);

      const body = response.body as { RspCode: string };
      expect(body.RspCode).toBeDefined();
    });

    it('should handle MoMo callback (POST)', async () => {
      const response = await request(app.getHttpServer() as unknown as string)
        .post('/code-payment-service/subscriptions/payment-callback/momo')
        .send({ resultCode: 0, orderId: '456' })
        .expect(200);

      const body = response.body as { resultCode: number };
      expect(body.resultCode).toBeDefined();
    });
  });
});
