import * as moment from 'moment-timezone';
import { PublicationEnum } from '..';
import { WashingtonPostRaw } from '../../washington-post/shared';
import { BloombergRaw } from '../../bloomberg/shared';
import { PMERaw } from '../../politico-morning-energy/shared';
import { CommonWealthRaw } from '../../commonwealth/shared';
import { BusinessInsiderRaw } from '../../business-insider/shared';

export class PublicationRaw {
  content: string;
  author: string;
  published: Date;
  publication: PublicationEnum;
  canonical?: string;

  public static washingtonPostFactory(washingtonPostRaw: WashingtonPostRaw) {
    const item = new PublicationRaw();

    item.publication = PublicationEnum.WASHINGTON_POST;
    item.content = washingtonPostRaw.content;
    item.author = washingtonPostRaw.author;
    item.published = moment(
      washingtonPostRaw.published,
      moment.ISO_8601,
    ).toDate();

    return item;
  }

  public static bloombergFactory(bloombergRaw: BloombergRaw) {
    const item = new PublicationRaw();

    item.publication = PublicationEnum.BLOOMBERG;
    item.author = bloombergRaw.author;
    item.published = moment(bloombergRaw.published, moment.ISO_8601).toDate();
    item.canonical = bloombergRaw.canonical;

    let content = '';
    bloombergRaw.contents.forEach((_) => {
      content += `${_}\n`;
    });
    item.content = content;

    return item;
  }

  public static pmeFactory(pmeRaw: PMERaw) {
    const item = new PublicationRaw();

    item.publication = PublicationEnum.POLITICO_MORNING_ENERGY;
    item.author = pmeRaw.author;
    item.published = moment
      .tz(pmeRaw.published, 'YYYY-MM-DD hh:mm:ss', 'America/New_York')
      .toDate();
    item.canonical = pmeRaw.canonical;

    let content = '';
    const maxL = Math.min(pmeRaw.contents.length, 15);
    for (let i = 2; i < maxL; i++) {
      const _ = pmeRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    return item;
  }

  public static commonwealthFactory(commonWealthRaw: CommonWealthRaw) {
    const item = new PublicationRaw();

    item.publication = PublicationEnum.COMMON_WEALTH;
    item.author = commonWealthRaw.author;
    item.published = moment(commonWealthRaw.published).toDate();
    item.canonical = commonWealthRaw.canonical;

    let content = '';
    const maxL = Math.min(commonWealthRaw.contents.length, 15);
    for (let i = 0; i < maxL; i++) {
      const _ = commonWealthRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    return item;
  }

  public static businessInsiderFactory(businessInsiderRaw: BusinessInsiderRaw) {
    const item = new PublicationRaw();

    item.publication = PublicationEnum.COMMON_WEALTH;
    item.author = businessInsiderRaw.author;
    item.published = moment
      .tz(businessInsiderRaw.published, 'America/New_York')
      .toDate();
    item.canonical = businessInsiderRaw.canonical;

    let content = '';
    const maxL = Math.min(businessInsiderRaw.contents.length, 15);
    for (let i = 0; i < maxL; i++) {
      const _ = businessInsiderRaw.contents[i];
      content += `${_}\n`;
    }
    item.content = content;

    return item;
  }
}
