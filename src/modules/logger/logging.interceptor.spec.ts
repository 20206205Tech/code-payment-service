/* eslint-disable */
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { RequestLog } from './entities/request-log.entity';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let repository: Repository<RequestLog>;

  const mockRequestLogRepo = {
    insert: jest.fn().mockReturnValue(Promise.resolve()),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn().mockReturnValue({
      method: 'GET',
      url: '/test',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      body: {},
      user: { userId: 'user-1' },
    }),
    getResponse: jest.fn().mockReturnValue({
      statusCode: 200,
    }),
    getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
    getHandler: jest.fn().mockReturnValue({ name: 'testMethod' }),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn().mockReturnValue(of({ data: 'test' })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: getRepositoryToken(RequestLog),
          useValue: mockRequestLogRepo,
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    repository = module.get<Repository<RequestLog>>(
      getRepositoryToken(RequestLog),
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request and response correctly on success', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(repository.insert).toHaveBeenCalled();
        const callArgs = (repository.insert as jest.Mock).mock.calls[0][0];
        expect(callArgs).toMatchObject({
          method: 'GET',
          url: '/test',
          statusCode: 200,
        });
        done();
      },
    });
  });

  it('should log request and error correctly on HttpException', (done) => {
    const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    mockCallHandler.handle.mockReturnValueOnce(throwError(() => error));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        expect(repository.insert).toHaveBeenCalled();
        const callArgs = (repository.insert as jest.Mock).mock.calls[1][0];
        expect(callArgs).toMatchObject({
          method: 'GET',
          url: '/test',
          statusCode: 403,
        });
        done();
      },
    });
  });

  it('should log request and error correctly on generic Error', (done) => {
    const error = new Error('Generic error');
    mockCallHandler.handle.mockReturnValueOnce(throwError(() => error));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        expect(repository.insert).toHaveBeenCalled();
        const callArgs = (repository.insert as jest.Mock).mock.calls[2][0];
        expect(callArgs).toMatchObject({
          method: 'GET',
          url: '/test',
          statusCode: 500,
        });
        done();
      },
    });
  });

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  describe('sanitizeData', () => {
    it('should handle circular structures', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // Access private method for testing
      const result = (interceptor as any).sanitizeData(circular);
      expect(result).toEqual({
        _note: '[Circular or unserializable data omitted]',
      });
    });

    it('should handle stream/express objects', () => {
      const mockStream = { socket: {}, writable: true };
      const result = (interceptor as any).sanitizeData(mockStream);
      expect(result).toEqual({ _note: '[Stream/Express Object omitted]' });
    });

    it('should return undefined for empty data', () => {
      expect((interceptor as any).sanitizeData(null)).toBeUndefined();
    });
  });
});
