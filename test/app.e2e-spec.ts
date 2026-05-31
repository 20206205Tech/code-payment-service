import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { httpServer } from './common/utils/http-server.util';
import { main } from './common/utils/main.util';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await main(AppModule);
  });

  it('GET /', async () => {
    const response = await request(httpServer(app))
      .get('/code-payment-service/')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      message: 'Hello World',
      docs: '/code-payment-service/docs',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
