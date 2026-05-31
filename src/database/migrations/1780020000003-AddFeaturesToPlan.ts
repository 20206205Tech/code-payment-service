import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturesToPlan1780020000003 implements MigrationInterface {
  name = 'AddFeaturesToPlan1780020000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan" ADD "features" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plan" DROP COLUMN "features"`);
  }
}