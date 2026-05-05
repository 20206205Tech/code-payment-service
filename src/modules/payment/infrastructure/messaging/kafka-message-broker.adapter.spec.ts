/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaMessageBrokerAdapter } from './kafka-message-broker.adapter';

// Mock kafkajs
jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue(undefined),
      })),
    })),
    CompressionTypes: { GZIP: 1 },
  };
});

describe('KafkaMessageBrokerAdapter', () => {
  let adapter: KafkaMessageBrokerAdapter;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'KAFKA_SSL_CA') return 'ca';
        if (key === 'KAFKA_SSL_CERT') return 'cert';
        if (key === 'KAFKA_SSL_KEY') return 'key';
        if (key === 'KAFKA_BROKER') return 'broker';
        return '';
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaMessageBrokerAdapter,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    adapter = module.get<KafkaMessageBrokerAdapter>(KafkaMessageBrokerAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('publishSubscriptionPurchased', () => {
    it('should call producer.send with correct payload', async () => {
      const payload = {
        userId: 'user-123',
        subscriptionId: 'sub-456',
        planId: 'plan-789',
        startDate: new Date(),
        endDate: new Date(),
      };

      await adapter.publishSubscriptionPurchased(payload);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      expect(
        (adapter as any as { producer: any }).producer.send,
      ).toHaveBeenCalledWith(
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: payload.userId,
            }),
          ]),
        }),
      );
    });
  });
});
