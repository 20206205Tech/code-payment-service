import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('request_logs')
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  requestId: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'text' })
  url: string;

  // @Column({ type: 'varchar', length: 50, nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  clientIp: string;
  // clientIp: string;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload: any;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload: any;

  @Column({ type: 'float' })
  processTime: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
