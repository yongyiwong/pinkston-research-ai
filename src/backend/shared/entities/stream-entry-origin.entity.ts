import {
  StreamEntryOriginHealthEnum,
  // StreamOriginEnum,
} from '../../stream-entry/shared';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { StreamEntries } from './stream-entries.entity';

@Entity({ name: 'streamEntryOrigin' })
@Unique(['name'])
export class StreamEntryOrigin {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({
  //   type: 'enum',
  //   enum: StreamOriginEnum,
  // })
  // name: StreamOriginEnum;
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: StreamEntryOriginHealthEnum,
  })
  health: StreamEntryOriginHealthEnum;

  @Column()
  updated: Date;

  @Column()
  status: boolean;

  @Column()
  fromFeedly: boolean;

  @Column()
  htmlUrl: string;

  @Column()
  note: string;

  @OneToMany(() => StreamEntries, (streamEntry) => streamEntry.origin)
  streamEntries: StreamEntries[];
}
