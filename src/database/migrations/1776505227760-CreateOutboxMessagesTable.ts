import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOutboxMessagesTable1776505227760 implements MigrationInterface {
    name = 'CreateOutboxMessagesTable1776505227760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outbox_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "aggregate_type" character varying(100) NOT NULL, "aggregate_id" uuid NOT NULL, "event_type" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'PENDING', "retry_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processed_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT "PK_0171348f527c64b137e4d4f5b66" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "outbox_messages"`);
    }

}
