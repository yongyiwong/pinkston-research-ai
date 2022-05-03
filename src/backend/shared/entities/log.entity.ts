import { LogTypeEnum } from '../../log/shared';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'logs' })
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LogTypeEnum,
  })
  type: LogTypeEnum;

  @Column()
  data: string;

  @Column()
  time: Date;
}
