import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('outbox_messages')
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string; // Tên Domain Model (VD: 'Chat', 'Share')

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId: string; // ID của Model

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string; // Tên Event (VD: 'ChatDeletedEvent')

  @Column({ name: 'payload', type: 'jsonb' })
  payload: any; // Dữ liệu sẽ gửi qua RabbitMQ

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING' })
  status: string; // PENDING, DONE, FAILED

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'processed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  processedAt: Date;
}
