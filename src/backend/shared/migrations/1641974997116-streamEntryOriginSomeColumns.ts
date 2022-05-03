import { MigrationInterface, QueryRunner } from 'typeorm';

export class streamEntryOrigoinSomeColumns1641974997116
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" ADD "fromFeedly" boolean NOT NULL DEFAULT FALSE;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" ADD "htmlUrl" text NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" DROP COLUMN "htmlUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" DROP COLUMN "fromFeedly"`,
    );
  }
}
