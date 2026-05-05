/* eslint-disable @typescript-eslint/unbound-method */
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError, type Observable } from 'rxjs';
import { SupabaseUserProfileService } from './supabase-user-profile.service';

describe('SupabaseUserProfileService', () => {
  let service: SupabaseUserProfileService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SUPABASE_PROJECT_ID') return 'test-project';
        if (key === 'SUPABASE_ANON_KEY') return 'test-key';
        return '';
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseUserProfileService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SupabaseUserProfileService>(
      SupabaseUserProfileService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile when user found', async () => {
      const mockResponse = {
        status: 200,
        data: [{ full_name: 'Test User' }],
      };
      httpService.get.mockReturnValue(
        of(mockResponse) as unknown as Observable<AxiosResponse<any, any>>,
      );

      const result = await service.getProfile('user-123');

      expect(result).toEqual({ fullName: 'Test User' });
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('user-123'),
        expect.anything(),
      );
    });

    it('should return null when user not found', async () => {
      const mockResponse = {
        status: 200,
        data: [],
      };
      httpService.get.mockReturnValue(
        of(mockResponse) as unknown as Observable<AxiosResponse<any, any>>,
      );

      const result = await service.getProfile('user-not-found');

      expect(result).toBeNull();
    });

    it('should return null when http request fails', async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const result = await service.getProfile('user-error');

      expect(result).toBeNull();
    });
  });
});
