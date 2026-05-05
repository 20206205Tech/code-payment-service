/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BrevoNotificationAdapter } from './brevo-notification.adapter';

// Mock BrevoClient
jest.mock('@getbrevo/brevo', () => {
  return {
    BrevoClient: jest.fn().mockImplementation(() => ({
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockResolvedValue({ messageId: 'msg-123' }),
      },
    })),
  };
});

describe('BrevoNotificationAdapter', () => {
  let adapter: BrevoNotificationAdapter;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'BREVO_API_KEY') return 'api-key';
        if (key === 'EMAIL_NAME') return 'AI Chatbot';
        if (key === 'EMAIL_ADDRESS') return 'no-reply@test.com';
        if (key === 'EMAIL_ADDRESS_DEV') return 'dev@test.com';
        return '';
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrevoNotificationAdapter,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    adapter = module.get<BrevoNotificationAdapter>(BrevoNotificationAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('sendPaymentSuccessEmail', () => {
    it('should call sendTransacEmail with correct parameters', async () => {
      await adapter.sendPaymentSuccessEmail(
        'user@test.com',
        'User Name',
        'Pro Plan',
        'txn-123',
      );

      expect(
        (adapter as any as { client: any }).client.transactionalEmails
          .sendTransacEmail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('thanh toán thành công'),
          to: [{ email: expect.any(String) }],
        }),
      );
    });
  });
});
