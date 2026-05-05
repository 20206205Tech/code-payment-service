import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVersion1777956756062 implements MigrationInterface {
    name = 'AddVersion1777956756062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "version" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "plan" ADD "version" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "version"`);
    }

}
