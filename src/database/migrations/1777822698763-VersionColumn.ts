import { MigrationInterface, QueryRunner } from "typeorm";

export class VersionColumn1777822698763 implements MigrationInterface {
    name = 'VersionColumn1777822698763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription" ADD "version" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_payment_status_enum" RENAME TO "transaction_payment_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_payment_status_enum" AS ENUM('pending', 'success', 'failed', 'expired')`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "payment_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "payment_status" TYPE "public"."transaction_payment_status_enum" USING "payment_status"::"text"::"public"."transaction_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "payment_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."transaction_payment_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_payment_status_enum_old" AS ENUM('pending', 'success', 'failed', 'refunded', 'expired')`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "payment_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "payment_status" TYPE "public"."transaction_payment_status_enum_old" USING "payment_status"::"text"::"public"."transaction_payment_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "transaction" ALTER COLUMN "payment_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."transaction_payment_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_payment_status_enum_old" RENAME TO "transaction_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "version"`);
    }

}
