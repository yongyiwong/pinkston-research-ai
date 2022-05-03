import { MigrationInterface, QueryRunner } from 'typeorm';

export class streamEntryColumnCategoryAdvancedGpt31642684617779
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD "categoryAdvancedGpt3" varchar NOT NULL DEFAULT '';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" DROP COLUMN "categoryAdvancedGpt3"`,
    );
  }
}
