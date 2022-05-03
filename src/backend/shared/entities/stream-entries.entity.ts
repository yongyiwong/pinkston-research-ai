import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StreamEntryOrigin } from './stream-entry-origin.entity';

@Entity({ name: 'streamEntries' })
@Unique(['entryId'])
export class StreamEntries {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({})
  entryId: string;

  @Column()
  originId: number;

  @Column()
  keywords: string;

  @Column()
  title: string;

  @Column()
  originTitle: string;

  @Column()
  author: string;

  @Column()
  published: Date;

  @Column()
  summaryContent: string;

  @Column()
  content: string;

  @Column()
  summaryGpt3: string;

  @Column()
  summary3pStatement: string;

  @Column()
  categoryGpt3: string;

  @Column()
  categoryAdvancedGpt3: string;

  @Column()
  amznMentioned: boolean;

  @Column()
  canonicalUrl: string;

  @Column()
  canonicalOrigin: string;

  @Column()
  commonTopics: string;

  @Column()
  entities: string;

  @Column()
  updated: Date;

  @Column()
  updatedGpt3: Date;

  @ManyToOne(() => StreamEntryOrigin, (origin) => origin.streamEntries)
  @JoinColumn({ name: 'originId' })
  origin: StreamEntryOrigin;
}
