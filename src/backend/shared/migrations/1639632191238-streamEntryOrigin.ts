import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class streamEntryOrigin1639632191238 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'streamEntryOrigin',
        columns: [
          {
            name: 'id',
            type: 'int4',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: false,
            isNullable: false,
          },
        ],
      }),
      false,
    );
    await queryRunner.query(`
      INSERT INTO public."streamEntryOrigin" (name) VALUES
        ('feedly'),
        ('non-rss-consumer-brands-assocation'),
        ('non-rss-thirdway'),
        ('non-rss-toy-association'),
        ('non-rss-fdra'),
        ('non-rss-msu'),
        ('non-rss-nbcsl'),
        ('non-rss-naleo'),
        ('non-rss-nhcsl'),
        ('non-rss-aafa'),
        ('non-rss-antitrust-ep'),
        ('non-rss-data-innovation'),
        ('non-rss-century-fundation'),
        ('non-rss-antitrust-institute'),
        ('non-rss-alliance-antitrust'),
        ('non-rss-open-competition'),
        ('non-rss-democratic-workplace'),
        ('non-rss-workforce-fairness');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "streamEntryOrigin"`);
  }
}
