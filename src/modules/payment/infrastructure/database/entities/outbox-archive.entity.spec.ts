import { OutboxArchiveEntity } from './outbox-archive.entity';

describe('OutboxArchiveEntity', () => {
  it('should be able to create a new instance with archive fields', () => {
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const processedAt = new Date('2024-01-02T00:00:00Z');
    const archivedAt = new Date('2024-01-09T00:00:00Z');

    const entity = new OutboxArchiveEntity();
    entity.id = 'msg-123';
    entity.aggregateType = 'Subscription';
    entity.aggregateId = 'agg-456';
    entity.eventType = 'SubscriptionPurchased';
    entity.payload = { subscriptionId: 'sub-1' };
    entity.status = 'DONE';
    entity.retryCount = 0;
    entity.createdAt = createdAt;
    entity.processedAt = processedAt;
    entity.archivedAt = archivedAt;

    expect(entity.id).toBe('msg-123');
    expect(entity.aggregateType).toBe('Subscription');
    expect(entity.aggregateId).toBe('agg-456');
    expect(entity.eventType).toBe('SubscriptionPurchased');
    expect(entity.payload).toEqual({ subscriptionId: 'sub-1' });
    expect(entity.status).toBe('DONE');
    expect(entity.retryCount).toBe(0);
    expect(entity.createdAt).toBe(createdAt);
    expect(entity.processedAt).toBe(processedAt);
    expect(entity.archivedAt).toBe(archivedAt);
  });

  it('should allow null processedAt for dead-letter archives', () => {
    const entity = new OutboxArchiveEntity();
    entity.id = 'msg-dead';
    entity.status = 'DEAD_LETTER';
    entity.processedAt = null;

    expect(entity.processedAt).toBeNull();
    expect(entity.status).toBe('DEAD_LETTER');
  });
});
