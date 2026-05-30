import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSubscriptionPeriodColumns1780020000002
  implements MigrationInterface
{
  name = 'RenameSubscriptionPeriodColumns1780020000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription" RENAME COLUMN "start_date" TO "period_start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" RENAME COLUMN "end_date" TO "period_end"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription" RENAME COLUMN "period_end" TO "end_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" RENAME COLUMN "period_start" TO "start_date"`,
    );
  }
}