import { INestApplication } from '@nestjs/common';
import request from 'supertest';

type SuperTestApp = Parameters<typeof request>[0];

type AppWithHttpServer = INestApplication & {
  getHttpServer(): SuperTestApp;
};

export function httpServer(app: AppWithHttpServer): SuperTestApp {
  return app.getHttpServer();
}
