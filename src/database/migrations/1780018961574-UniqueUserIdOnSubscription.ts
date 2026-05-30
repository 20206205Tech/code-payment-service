import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueUserIdOnSubscription1780018961574
  implements MigrationInterface
{
  name = 'UniqueUserIdOnSubscription1780018961574';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Xóa các bản ghi trùng user_id, chỉ giữ lại bản ghi mới nhất (created_at lớn nhất)
    await queryRunner.query(`
      DELETE FROM "subscription"
      WHERE id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM "subscription"
        ORDER BY user_id, created_at DESC
      )
    `);

    // Thêm unique constraint trên user_id
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "UQ_subscription_user_id" UNIQUE ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "UQ_subscription_user_id"`,
    );
  }
}
