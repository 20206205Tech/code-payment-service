import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionTable1776505359955 implements MigrationInterface {
    name = 'CreateSubscriptionTable1776505359955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscription_status_enum" AS ENUM('pending', 'active', 'expired')`);
        await queryRunner.query(`CREATE TABLE "subscription" ("id" uuid NOT NULL, "user_id" character varying(255) NOT NULL, "plan_id" uuid NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "subscription"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_status_enum"`);
    }

}
