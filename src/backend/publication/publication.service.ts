import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../log/log.service';
import { StreamEntryService } from '../stream-entry/stream-entry.service';
import { PublicationEnum } from './shared/enum/publication.enum';
import { WashingtonPostService } from './washington-post/washington-post.service';
import { PublicationRaw } from './shared';
import { BloombergService } from './bloomberg/bloomberg.service';
import { PoloticoMorningEnergyService } from './politico-morning-energy/politico-morning-energy.service';
import { CommonWealthService } from './commonwealth/common-wealth.service';
import { BusinessInsiderService } from './business-insider/business-insider.service';

@Injectable()
export class PublicationService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,

    private washingtonPostService: WashingtonPostService,
    private bloombergService: BloombergService,
    private pmeService: PoloticoMorningEnergyService,
    private commonWealthService: CommonWealthService,
    private businessInsiderService: BusinessInsiderService,
  ) {}

  async getSub(
    publication: string,
    canonical: string,
    opt: any,
  ): Promise<PublicationRaw> {
    switch (publication) {
      // case PublicationEnum.WASHINGTON_POST:
      //   return await this.washingtonPostService.getSub(canonical, opt);
      // case PublicationEnum.NEWYORK_TIMES:
      //   break;
      // case PublicationEnum.BLOOMBERG:
      //   return await this.bloombergService.getSub(canonical, opt);
      // case PublicationEnum.NEW_REPUBLIC:
      //   break;
      // case PublicationEnum.POLITICO_MORNING_ENERGY:
      //   return await this.pmeService.getSub(canonical, opt);
      // case PublicationEnum.COMMON_WEALTH:
      //   return await this.commonWealthService.getSub(canonical, opt);
      case PublicationEnum.BUSINESS_INSIDER:
        return await this.businessInsiderService.getSub(canonical, opt);
      default:
        break;
    }

    return null;
  }
}
