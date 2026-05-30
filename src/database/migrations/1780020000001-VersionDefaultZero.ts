import { MigrationInterface, QueryRunner } from 'typeorm';

export class VersionDefaultZero1780020000001 implements MigrationInterface {
  name = 'VersionDefaultZero1780020000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Đổi default cột version về 0 trên cả 3 bảng
    await queryRunner.query(
      `ALTER TABLE "subscription" ALTER COLUMN "version" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "version" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan" ALTER COLUMN "version" SET DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription" ALTER COLUMN "version" SET DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "version" SET DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "plan" ALTER COLUMN "version" SET DEFAULT '1'`,
    );
  }
}
