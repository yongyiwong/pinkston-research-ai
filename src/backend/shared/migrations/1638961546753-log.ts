import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class log1638961546753 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'logs',
        columns: [
          {
            name: 'id',
            type: 'int4',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'time',
            type: 'timestamptz',
            isNullable: false,
          },
        ],
      }),
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "logs"`);
  }
}
