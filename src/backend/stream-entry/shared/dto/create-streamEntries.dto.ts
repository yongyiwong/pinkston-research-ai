import * as moment from 'moment-timezone';
import * as numeral from 'numeral';
import { EntryRaw } from '../../../feedly/shared';
import { StreamOriginEnum } from '..';
import { CBAEntryRaw } from '../../../non-rss/consumer-brands-association/shared';
import { PublicationEntryRaw } from '../../../publication/shared';
import { NonRssOriginEnum } from '../../../non-rss/shared';
import { ToyAEntryRaw } from '../../../non-rss/toy-association/shared';
import { FdraEntryRaw } from '../../../non-rss/fdra/shared';
import { MSUEntryRaw } from '../../../non-rss/msu/shared';
import { NbcslEntryRaw } from '../../../non-rss/nbcsl/shared';
import { NaleoEntryRaw } from '../../../non-rss/naleo/shared';
import { NhcslEntryRaw } from '../../../non-rss/nhcsl/shared';
import { AafaEntryRaw } from '../../../non-rss/aafa/shared';
import { AntitrustEPEntryRaw } from '../../../non-rss/antitrust-ep/shared';
import { DataInnovationEntryRaw } from '../../../non-rss/data-innovation/shared';
import { CenturyFundationEntryRaw } from '../../../non-rss/century-fundation/shared';
import { AntitrustInstituteEntryRaw } from '../../../non-rss/antitrust-institute/shared';
import { AllianceAntitrustEntryRaw } from '../../../non-rss/alliance-antitrust/shared';
import { TruthMarketEntryRaw } from '../../../non-rss/truth-market/shared';
import { OpenCompetitionEntryRaw } from '../../../non-rss/open-competition/shared';
import { DemocraticWorkplaceEntryRaw } from '../../../non-rss/democratic-workplace/shared';
import { WorkforceFairnessEntryRaw } from '../../../non-rss/workforce-fairness/shared';
import { InstituteAWEntryRaw } from '../../../non-rss/institute-aw/shared';
import { AppAssociationEntryRaw } from '../../../non-rss/app-association/shared';
import { StreamEntryOrigin } from '../../../shared/entities/stream-entry-origin.entity';

export class CreateStreamEntries {
  entryId: string;
  originId: number;
  keywords: string;
  title: string;
  originTitle: string;
  author: string;
  published: Date;
  content: string;
  summaryContent: string;
  canonicalUrl: string;
  canonicalOrigin: string;
  commonTopics: string;
  entities: string;
  updated: Date;

  public static feedlyEntryRawFactory(entryRaw: EntryRaw, option: any) {
    const streamEntryOrigin = <StreamEntryOrigin>option.streamEntryOrigin;
    const item = new CreateStreamEntries();

    item.originId = streamEntryOrigin.id;
    item.entryId = entryRaw.id;
    item.keywords = entryRaw.keywords
      ? JSON.stringify(entryRaw.keywords)
      : null;
    item.title = entryRaw.title;
    item.originTitle = entryRaw.origin?.title || null;
    item.author = entryRaw.author || null;
    item.published = moment(entryRaw.published).toDate();
    item.summaryContent = entryRaw.summary?.content || null;
    item.canonicalUrl =
      entryRaw.canonical?.[0]?.href || entryRaw.canonicalUrl || null;
    item.commonTopics = entryRaw.commonTopics
      ? JSON.stringify(entryRaw.commonTopics)
      : null;
    item.entities = entryRaw.entities
      ? JSON.stringify(entryRaw.entities)
      : null;
    item.updated = option?.updated ? moment(option?.updated).toDate() : null;

    return item;
  }

  public static cbaEntryRawFactory(entryRaw: CBAEntryRaw /*, option: any*/) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_CONSUMER_BRANDS_ASSOCIATION;
    item.author = entryRaw.author;
    item.title = entryRaw.title;
    item.content = entryRaw.content;
    item.canonicalUrl = entryRaw.canonical;
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static toyAEntryRawFactory(entryRaw: ToyAEntryRaw) {
    const item = new CreateStreamEntries();

    let content = '';
    const maxL = Math.min(entryRaw.contents.length, 15);
    for (let i = 1; i < maxL; i++) {
      const _ = entryRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_TOY_ASSOCIATION;
    item.author = entryRaw.author;
    item.title = entryRaw.title;
    item.summaryContent = entryRaw.description;
    item.canonicalUrl = entryRaw.canonical;
    item.published = moment
      .tz(
        // entryRaw.published.replace(/[^\w\s]/gi, '').trim(),
        entryRaw.published,
        'MMMM D, YYYY',
        'America/New_York',
      )
      .toDate();
    item.keywords = entryRaw.keywords
      ? JSON.stringify(entryRaw.keywords.split(','))
      : null;

    return item;
  }

  public static fdraEntryRawFactory(entryRaw: FdraEntryRaw) {
    const item = new CreateStreamEntries();

    let content = '';
    const maxL = Math.min(entryRaw.contents.length, 15);
    for (let i = 0; i < maxL; i++) {
      const _ = entryRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_FDRA;
    item.author = entryRaw.author;
    item.title = entryRaw.title;
    item.summaryContent = entryRaw.description;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.canonicalUrl = entryRaw.canonical;

    const published = moment.tz(
      `${entryRaw.published} 00:00:00`,
      'DD MMMM, YYYY HH:mm:ss',
      'America/New_York',
    );

    if (entryRaw.time) {
      const matches = entryRaw.time.match(/^Posted at (\d+):(\d+)h$/);
      if (matches || matches.length > 2) {
        const hour = numeral(matches[1]).value();
        const minute = numeral(matches[2]).value();
        published.set({ hour, minute });
      }
    }
    item.published = published.toDate();

    return item;
  }

  public static msuEntryRawFactory(entryRaw: MSUEntryRaw) {
    const item = new CreateStreamEntries();

    let content = '';
    const maxL = Math.min(entryRaw.contents.length, 15);
    for (let i = 1; i < maxL; i++) {
      const _ = entryRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_MSU;
    item.title = entryRaw.title;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.canonicalUrl = entryRaw.canonical;

    const matches = entryRaw.author.match(/(^.+)?, (\d+)$/);
    if (!matches || matches.length < 3) {
      return null;
    }

    item.author = matches[1];
    item.published = moment
      .tz(
        `${matches[2]}-01-01 00:00:00"`,
        'YYYY-MM-DD HH:mm:ss',
        'America/New_York',
      )
      .toDate();

    return item;
  }

  public static nbcslEntryRawFactory(entryRaw: NbcslEntryRaw) {
    const item = new CreateStreamEntries();

    let content = '';
    const maxL = Math.min(entryRaw.contents.length, 15);
    for (let i = 1; i < maxL; i++) {
      const _ = entryRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_NBCSL;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.summaryContent = entryRaw.description;
    item.author = entryRaw.author;
    item.keywords = entryRaw.keywords
      ? JSON.stringify(entryRaw.keywords.split(','))
      : null;

    item.published = moment
      .tz(entryRaw.published.trim(), 'dddd, MMMM D, YYYY', 'America/New_York')
      .toDate();

    return item;
  }

  public static naleoEntryRawFactory(entryRaw: NaleoEntryRaw) {
    const item = new CreateStreamEntries();

    item.content = entryRaw.content;

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_NALEO;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.author = entryRaw.authors ? entryRaw.authors.join() : null;

    item.published = moment
      .tz(entryRaw.published.trim(), 'MMMM D, YYYY', 'America/New_York')
      .toDate();

    return item;
  }

  public static nhcslEntryRawFactory(entryRaw: NhcslEntryRaw) {
    const item = new CreateStreamEntries();

    let content = '';
    const maxL = Math.min(entryRaw.contents.length, 15);
    for (let i = 1; i < maxL; i++) {
      const _ = entryRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_NHCSL;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.summaryContent = entryRaw.description;
    item.keywords = entryRaw.keywords
      ? JSON.stringify(entryRaw.keywords.split(','))
      : null;

    item.published = moment
      .tz(entryRaw.published.trim(), 'MMM D, YYYY', 'America/New_York')
      .toDate();

    return item;
  }

  public static aafaEntryRawFactory(entryRaw: AafaEntryRaw) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_AAFA;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.summaryContent = entryRaw.description;
    item.published = moment
      .tz(entryRaw.published.trim(), 'MMM. D, YYYY', 'America/New_York')
      .toDate();

    return item;
  }

  public static antitrustEPEntryRawFactory(entryRaw: AntitrustEPEntryRaw) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_ANTITRUST_EP;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.content = entryRaw.content;
    item.published = moment
      .tz(entryRaw.published.trim(), 'M/D/YYYY', 'America/New_York')
      .toDate();

    return item;
  }

  public static dataInnovationEntryRawFactory(
    entryRaw: DataInnovationEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_DATAINNOVATION;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.author = entryRaw.author;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content;
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static centuryFundationEntryRawFactory(
    entryRaw: CenturyFundationEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_CENTURY_FUNDATION;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.author = entryRaw.author;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content;
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static antitrustInstituteEntryRawFactory(
    entryRaw: AntitrustInstituteEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_ANTITRUST_INSTITUTE;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.author = entryRaw.author;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content;
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static allianceAntitrustEntryRawFactory(
    entryRaw: AllianceAntitrustEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_ALLIANCE_ANTITRUST;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.author = entryRaw.author;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content?.trim();
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static truthMarketEntryRawFactory(entryRaw: TruthMarketEntryRaw) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_TRUTH_MARKET;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.author = entryRaw.author;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content?.trim();
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static openCompetitionEntryRawFactory(
    entryRaw: OpenCompetitionEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_OPEN_COMPETITION;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content?.trim();
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static democraticWorkplaceEntryRawFactory(
    entryRaw: DemocraticWorkplaceEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_DEMOCRATIC_WORKPLACE;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content?.trim();
    item.published = moment(entryRaw.published).toDate();

    return item;
  }

  public static workforceFairnessEntryRawFactory(
    entryRaw: WorkforceFairnessEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_WORKFROCE_FAIRNESS;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.summaryContent = entryRaw.description;
    item.published = entryRaw.published;

    return item;
  }

  public static instituteAWEntryRawFactory(entryRaw: InstituteAWEntryRaw) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_INSTITUTE_AW;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content;

    if (entryRaw.published) {
      item.published = moment(entryRaw.published).toDate();
    } else {
      const matches = item.content.match('[a-zA-Z]+ [0-9]{1,2}, [0-9]{4}');
      if (!matches || matches.length < 1) {
        return null;
      }

      const strPublished = matches[0];
      const momentPublished = moment.tz(
        strPublished,
        'MMM DD, YYYY',
        'America/New_York',
      );
      if (!momentPublished.isValid()) {
        return null;
      }

      item.published = momentPublished.toDate();
    }

    return item;
  }

  public static appAssociationEntryRawFactory(
    entryRaw: AppAssociationEntryRaw,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.originId = StreamOriginEnum.NON_RSS_APP_ASSOCIATION;
    item.title = entryRaw.title;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.summaryContent = entryRaw.description;
    item.content = entryRaw.content;
    item.author = entryRaw.author;
    item.published = moment
      .tz(entryRaw.published, 'MMM Do, YYYY', 'America/New_York')
      .toDate();

    return item;
  }

  public static publicationRawFactory(
    entryRaw: PublicationEntryRaw /*, option: any*/,
  ) {
    const item = new CreateStreamEntries();

    item.entryId = entryRaw.entryId;
    item.author = entryRaw.author;
    item.title = entryRaw.title;
    item.content = entryRaw.content;
    item.canonicalUrl = entryRaw.canonical;
    item.canonicalOrigin = entryRaw.canonicalOrigin;
    item.published = entryRaw.published;

    switch (entryRaw.nonRssOrigin) {
      case NonRssOriginEnum.THIRDWAY:
        item.originId = StreamOriginEnum.NON_RSS_THIRDWAY;
        break;
      default:
        break;
    }

    return item;
  }
}
