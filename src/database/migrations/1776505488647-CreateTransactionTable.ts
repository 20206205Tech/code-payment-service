import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTransactionTable1776505488647 implements MigrationInterface {
    name = 'CreateTransactionTable1776505488647'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_payment_status_enum" AS ENUM('pending', 'success', 'failed', 'refunded', 'expired')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL, "user_id" character varying(255) NOT NULL, "subscription_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "base_amount" numeric(10,2) NOT NULL, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "final_amount" numeric(10,2) NOT NULL, "payment_method" character varying(50) NOT NULL, "transaction_ref" character varying(255) NOT NULL, "payment_status" "public"."transaction_payment_status_enum" NOT NULL DEFAULT 'pending', "provider_transaction_id" character varying(100), "payment_metadata" jsonb, "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_88a74fa622298ce71535b2d01a3" UNIQUE ("transaction_ref"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_payment_status_enum"`);
    }

}
