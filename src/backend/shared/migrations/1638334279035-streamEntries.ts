import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class streamEntries1638334279035 implements MigrationInterface {
  name = 'streamEntries1638334279035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'streamEntries',
        columns: [
          {
            name: 'id',
            type: 'int4',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'entryId',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'keywords',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'categoryGpt3',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'originTitle',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'author',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'published',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'summaryContent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'summaryGpt3',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'canonicalUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'commonTopics',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'entities',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'updated',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'updatedGpt3',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "streamEntries"`);
  }
}
