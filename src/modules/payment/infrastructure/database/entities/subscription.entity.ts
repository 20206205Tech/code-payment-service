import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SubscriptionStatus } from '../../../domain/value-objects/subscription-status';

@Entity('subscription')
@Index('UQ_subscription_user_id', ['userId'], { unique: true })
export class SubscriptionEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ name: 'period_start', type: 'timestamptz' })
  periodStart!: Date;

  @Column({ name: 'period_end', type: 'timestamptz' })
  periodEnd!: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status!: SubscriptionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'version', type: 'int', default: 0 })
  version!: number;
}
