import { MigrationInterface, QueryRunner } from 'typeorm';

export class streamEntryOriginSomeColumns1641606492160
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" ADD "note" text NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" ADD "status" boolean NOT NULL DEFAULT true;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" ADD "updated" timestamptz NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" ADD "health" varchar NOT NULL DEFAULT 'Active';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" DROP COLUMN "health"`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" DROP COLUMN "updated"`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntryOrigin" DROP COLUMN "note"`,
    );
  }
}
