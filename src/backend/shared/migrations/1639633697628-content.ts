import { MigrationInterface, QueryRunner } from 'typeorm';

export class content1639633697628 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD "content" text NULL;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD "originId" int4 NOT NULL DEFAULT 1;`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" ADD CONSTRAINT streamentries_fk FOREIGN KEY ("originId") REFERENCES public."streamEntryOrigin"(id) ON DELETE RESTRICT ON UPDATE CASCADE;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" DROP COLUMN "content"`,
    );
    await queryRunner.query(
      `ALTER TABLE public."streamEntries" DROP COLUMN "originId"`,
    );
  }
}
