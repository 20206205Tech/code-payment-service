import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseClientIP1776586397532 implements MigrationInterface {
    name = 'IncreaseClientIP1776586397532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_logs" DROP COLUMN "clientIp"`);
        await queryRunner.query(`ALTER TABLE "request_logs" ADD "clientIp" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_logs" DROP COLUMN "clientIp"`);
        await queryRunner.query(`ALTER TABLE "request_logs" ADD "clientIp" character varying(50)`);
    }

}
