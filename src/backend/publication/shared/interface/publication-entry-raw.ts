import { PublicationEnum } from '..';
import { NonRssOriginEnum } from '../../../non-rss/shared';

export interface PublicationEntryRaw {
  entryId: string;
  canonical: string;
  canonicalOrigin: string;
  title: string;
  author: string;
  content: string;
  published: Date;
  publication: PublicationEnum;
  nonRssOrigin: NonRssOriginEnum;
}
