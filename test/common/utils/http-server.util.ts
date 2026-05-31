import { INestApplication } from '@nestjs/common';
import request from 'supertest';

type SuperTestApp = Parameters<typeof request>[0];

export function httpServer(app: INestApplication): SuperTestApp {
  return app.getHttpServer() as SuperTestApp;
}
