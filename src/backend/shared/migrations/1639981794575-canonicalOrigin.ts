import { MigrationInterface, QueryRunner } from 'typeorm';

export class canonicalOrigin1639981794575 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD "canonicalOrigin" text NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" DROP COLUMN "canonicalOrigin"`,
    );
  }
}
