/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MESSAGE_BROKER_PORT,
  MessageBrokerPort,
} from '../../application/ports/messaging/message-broker.port';
import { OutboxEntity } from '../database/entities/outbox.entity';
import { OutboxRelayCron } from './outbox-relay.cron';

describe('OutboxRelayCron', () => {
  let cron: OutboxRelayCron;
  let outboxRepo: jest.Mocked<Repository<OutboxEntity>>;
  let messageBroker: jest.Mocked<MessageBrokerPort>;

  beforeEach(async () => {
    outboxRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OutboxEntity>>;
    messageBroker = {
      publishSubscriptionPurchased: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxRelayCron,
        { provide: getRepositoryToken(OutboxEntity), useValue: outboxRepo },
        { provide: MESSAGE_BROKER_PORT, useValue: messageBroker },
      ],
    }).compile();

    cron = module.get<OutboxRelayCron>(OutboxRelayCron);
  });

  it('should be defined', () => {
    expect(cron).toBeDefined();
  });

  it('should process pending messages and publish to broker', async () => {
    const mockMsg = new OutboxEntity();
    mockMsg.id = 'msg-1';
    mockMsg.eventType = 'SubscriptionPurchasedEvent';
    mockMsg.status = 'PENDING';
    mockMsg.payload = {
      subscriptionId: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
    };

    outboxRepo.find.mockResolvedValue([mockMsg]);
    messageBroker.publishSubscriptionPurchased.mockResolvedValue(undefined);
    outboxRepo.save.mockResolvedValue(undefined);

    await cron.processOutboxMessages();

    expect(outboxRepo.find).toHaveBeenCalled();
    expect(messageBroker.publishSubscriptionPurchased).toHaveBeenCalled();
    expect(mockMsg.status).toBe('DONE');
    expect(outboxRepo.save).toHaveBeenCalledWith(mockMsg);
  });

  it('should mark message as FAILED if broker publishing fails', async () => {
    const mockMsg = new OutboxEntity();
    mockMsg.id = 'msg-error';
    mockMsg.eventType = 'SubscriptionPurchasedEvent';
    mockMsg.status = 'PENDING';
    mockMsg.payload = {
      subscriptionId: 's',
      userId: 'u',
      planId: 'p',
      periodStart: '',
      periodEnd: '',
    };

    outboxRepo.find.mockResolvedValue([mockMsg]);
    messageBroker.publishSubscriptionPurchased.mockRejectedValue(
      new Error('Kafka Down'),
    );
    outboxRepo.save.mockResolvedValue(undefined);

    await cron.processOutboxMessages();

    expect(mockMsg.status).toBe('FAILED');
    expect(outboxRepo.save).toHaveBeenCalledWith(mockMsg);
  });

  it('should handle unknown event types gracefully', async () => {
    const mockMsg = new OutboxEntity();
    mockMsg.eventType = 'UnknownEvent';
    mockMsg.status = 'PENDING';

    outboxRepo.find.mockResolvedValue([mockMsg]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loggerSpy = jest.spyOn((cron as any).logger, 'warn');

    await cron.processOutboxMessages();

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Không tìm thấy handler'),
    );
    expect(mockMsg.status).toBe('DONE'); // It still marks as DONE to avoid infinite loop on unknown events
  });
});
