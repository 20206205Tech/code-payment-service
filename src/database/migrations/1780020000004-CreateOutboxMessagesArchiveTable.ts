import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxMessagesArchiveTable1780020000004
  implements MigrationInterface
{
  name = 'CreateOutboxMessagesArchiveTable1780020000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "outbox_messages_archive" (
        "id" uuid NOT NULL,
        "aggregate_type" character varying(100) NOT NULL,
        "aggregate_id" uuid NOT NULL,
        "event_type" character varying(100) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying(20) NOT NULL,
        "retry_count" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "archived_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_messages_archive" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "outbox_messages_archive"`);
  }
}
