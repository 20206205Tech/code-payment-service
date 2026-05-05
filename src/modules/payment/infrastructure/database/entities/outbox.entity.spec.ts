import { OutboxEntity } from './outbox.entity';

describe('OutboxEntity', () => {
  it('should be able to create a new instance', () => {
    const entity = new OutboxEntity();
    entity.id = 'msg-123';
    entity.eventType = 'TestEvent';
    entity.status = 'PENDING';

    expect(entity.id).toBe('msg-123');
    expect(entity.status).toBe('PENDING');
  });
});
