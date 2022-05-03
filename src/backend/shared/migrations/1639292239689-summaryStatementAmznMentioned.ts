import { MigrationInterface, QueryRunner } from 'typeorm';

export class summaryStatementAmznMentioned1639292239689
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD "summary3pStatement" text NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD "amznMentioned" boolean NOT NULL DEFAULT false;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" DROP COLUMN "amznMentioned"`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" DROP COLUMN "summary3pStatement"`,
    );
  }
}
