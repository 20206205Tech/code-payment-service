import { MigrationInterface, QueryRunner } from "typeorm";

export class XXXXXXXXXXXX1777973412685 implements MigrationInterface {
    name = 'XXXXXXXXXXXX1777973412685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "version" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "plan" ADD "version" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "version"`);
    }

}
