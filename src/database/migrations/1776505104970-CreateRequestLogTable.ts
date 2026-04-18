import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRequestLogTable1776505104970 implements MigrationInterface {
    name = 'CreateRequestLogTable1776505104970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "request_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" character varying(255), "method" character varying(10) NOT NULL, "url" text NOT NULL, "clientIp" character varying(50), "statusCode" integer NOT NULL, "requestPayload" jsonb, "responsePayload" jsonb, "processTime" double precision NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1edd3815ae37a9b9511f5a26dca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_33c4c3a3815f57420024f66571" ON "request_logs" ("requestId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_33c4c3a3815f57420024f66571"`);
        await queryRunner.query(`DROP TABLE "request_logs"`);
    }

}
