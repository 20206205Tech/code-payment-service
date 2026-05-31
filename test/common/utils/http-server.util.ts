import request from 'supertest';

type SuperTestApp = Parameters<typeof request>[0];

type AppWithHttpServer = {
  getHttpServer(): SuperTestApp;
};

export function httpServer(app: AppWithHttpServer): SuperTestApp {
  return app.getHttpServer();
}
