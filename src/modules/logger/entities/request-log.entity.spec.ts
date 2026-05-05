import { RequestLog } from './request-log.entity';

describe('RequestLog', () => {
  it('should be defined', () => {
    expect(new RequestLog()).toBeDefined();
  });

  it('should allow setting properties', () => {
    const log = new RequestLog();
    const now = new Date();
    log.id = 'uuid';
    log.requestId = 'req-123';
    log.method = 'GET';
    log.url = '/test';
    log.clientIp = '127.0.0.1';
    log.statusCode = 200;
    log.requestPayload = { key: 'value' };
    log.responsePayload = { success: true };
    log.processTime = 0.5;
    log.createdAt = now;

    expect(log.id).toBe('uuid');
    expect(log.requestId).toBe('req-123');
    expect(log.method).toBe('GET');
    expect(log.url).toBe('/test');
    expect(log.clientIp).toBe('127.0.0.1');
    expect(log.statusCode).toBe(200);
    expect(log.requestPayload).toEqual({ key: 'value' });
    expect(log.responsePayload).toEqual({ success: true });
    expect(log.processTime).toBe(0.5);
    expect(log.createdAt).toBe(now);
  });
});
