/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { OutboxArchiveEntity } from '../database/entities/outbox-archive.entity';
import { OutboxEntity } from '../database/entities/outbox.entity';
import { OutboxArchiveCron } from './outbox-archive.cron';

describe('OutboxArchiveCron', () => {
  let cron: OutboxArchiveCron;
  let entityManager: jest.Mocked<EntityManager>;
  let transactionManager: {
    find: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    transactionManager = {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    entityManager = {
      transaction: jest.fn(
        async (
          runInTransaction: (manager: EntityManager) => Promise<unknown>,
        ) => runInTransaction(transactionManager as unknown as EntityManager),
      ),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxArchiveCron,
        { provide: getEntityManagerToken(), useValue: entityManager },
      ],
    }).compile();

    cron = module.get<OutboxArchiveCron>(OutboxArchiveCron);
  });

  it('should be defined', () => {
    expect(cron).toBeDefined();
  });

  it('should skip when no messages need archiving', async () => {
    transactionManager.find.mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loggerSpy = jest.spyOn((cron as any).logger, 'log');

    await cron.handleArchiveOutbox();

    expect(entityManager.transaction).toHaveBeenCalledTimes(1);
    expect(transactionManager.save).not.toHaveBeenCalled();
    expect(transactionManager.delete).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(
      'Không có outbox message nào cần archive hôm nay.',
    );
  });

  it('should archive and delete eligible messages', async () => {
    const message: OutboxEntity = {
      id: 'msg-1',
      aggregateType: 'Subscription',
      aggregateId: 'agg-1',
      eventType: 'SubscriptionPurchased',
      payload: { subscriptionId: 'sub-1' },
      status: 'DONE',
      retryCount: 0,
      createdAt: new Date('2024-01-01'),
      processedAt: new Date('2024-01-02'),
    };

    transactionManager.find
      .mockResolvedValueOnce([message])
      .mockResolvedValueOnce([]);
    transactionManager.save.mockResolvedValue(undefined);
    transactionManager.delete.mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loggerSpy = jest.spyOn((cron as any).logger, 'log');

    await cron.handleArchiveOutbox();

    expect(transactionManager.save).toHaveBeenCalledTimes(1);
    const saveCalls = transactionManager.save.mock.calls as Array<
      [OutboxArchiveEntity[]]
    >;
    const saved = saveCalls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('msg-1');
    expect(saved[0].status).toBe('DONE');
    expect(saved[0].archivedAt).toBeInstanceOf(Date);
    expect(transactionManager.delete).toHaveBeenCalledWith(OutboxEntity, [
      'msg-1',
    ]);
    expect(loggerSpy).toHaveBeenCalledWith(
      'Đã archive thành công 1 outbox message(s).',
    );
  });

  it('should handle error during archive', async () => {
    entityManager.transaction.mockRejectedValue(new Error('DB Error'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loggerSpy = jest.spyOn((cron as any).logger, 'error');

    await cron.handleArchiveOutbox();

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lỗi trong quá trình archive outbox messages:'),
      expect.any(Error),
    );
  });
});
