import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { LogService } from '../log/log.service';
import { StreamEntryService } from '../stream-entry/stream-entry.service';
import { ConsumerBrandsAssociationService } from './consumer-brands-association/consumer-brands-association.service';
import { ThirdwayService } from './thirdway/thirdway.service';
import { ToyAssociationService } from './toy-association/toy-association.service';
import { FdraService } from './fdra/fdra.service';
import { MSUService } from './msu/msu.service';
import { NbcslService } from './nbcsl/nbcsl.service';
import { NaleoService } from './naleo/naleo.service';
import { NhcslService } from './nhcsl/nhcsl.service';
import { AafaService } from './aafa/aafa.service';
import { AntitrustEPService } from './antitrust-ep/antitrust-ep.service';
import { DataInnovationService } from './data-innovation/data-innovation.service';
import { CenturyFundationService } from './century-fundation/century-fundation.service';
import { AntitrustInstituteService } from './antitrust-institute/antitrust-institute.service';
import { AllianceAntitrustService } from './alliance-antitrust/alliance-antitrust.service';
import { TruthMarketService } from './truth-market/truth-market.service';
import { OpenCompetitionService } from './open-competition/open-competition.service';
import { DemocraticWorkplaceService } from './democratic-workplace/democratic-workplace.service';
import { WorkforceFairnessService } from './workforce-fairness/workforce-fairness.service';
import { InstituteAWService } from './institute-aw/institute-aw.service';
import { AppAssociationService } from './app-association/app-association.service';

@Injectable()
export class NonRssService {
  private readonly logger = new Logger(NonRssService.name);
  private isBuilding = false;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logService: LogService,

    private streamEntryService: StreamEntryService,
    private cbaService: ConsumerBrandsAssociationService,
    private twService: ThirdwayService,
    private toyAService: ToyAssociationService,
    private fdraService: FdraService,
    private msuService: MSUService,
    private nbcslService: NbcslService,
    private naleoService: NaleoService,
    private nhcslService: NhcslService,
    private aafaService: AafaService,
    private antitrustEPService: AntitrustEPService,
    private dataInnovationService: DataInnovationService,
    private centuryFundationService: CenturyFundationService,
    private antitrustInstituteService: AntitrustInstituteService,
    private allianceAntitrustService: AllianceAntitrustService,
    private truthMarketService: TruthMarketService,
    private openCompetitionService: OpenCompetitionService,
    private democraticWorkplaceService: DemocraticWorkplaceService,
    private workforceFairnessService: WorkforceFairnessService,
    private instituteAWService: InstituteAWService,
    private appAssociation: AppAssociationService,
  ) {}

  @Cron('0 0 * * *')
  // @Cron('30 * * * *')
  // @Cron('* * * * *')
  async handleCron() {
    if (this.isBuilding) {
      return;
    }
    this.isBuilding = true;

    await this.cbaService.getMain();
    // await this.twService.getMain();
    await this.toyAService.getMain();
    await this.fdraService.getMain();
    await this.msuService.getMain();
    await this.nbcslService.getMain();
    await this.naleoService.getMain();
    await this.nhcslService.getMain();
    await this.aafaService.getMain();
    await this.antitrustEPService.getMain();
    await this.dataInnovationService.getMain();
    await this.centuryFundationService.getMain();
    await this.antitrustInstituteService.getMain();
    await this.allianceAntitrustService.getMain();
    await this.truthMarketService.getMain();
    await this.openCompetitionService.getMain();
    await this.democraticWorkplaceService.getMain();
    await this.workforceFairnessService.getMain();
    await this.instituteAWService.getMain();
    await this.appAssociation.getMain();

    this.isBuilding = false;
  }
}
