import { Module } from '@nestjs/common';
import { NonRssService } from './non-rss.service';
import { NonRssController } from './non-rss.controller';
import { ConsumerBrandsAssociationService } from './consumer-brands-association/consumer-brands-association.service';
import { LogModule } from '../log/log.module';
import { StreamEntryModule } from '../stream-entry/stream-entry.module';
import { HttpModule } from '@nestjs/axios';
import { ThirdwayService } from './thirdway/thirdway.service';
import { PublicationModule } from '../publication/publication.module';
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

@Module({
  imports: [
    LogModule,
    HttpModule.register({
      timeout: 300000,
      maxRedirects: 5,
    }),
    StreamEntryModule,
    PublicationModule,
  ],
  controllers: [NonRssController],
  providers: [
    NonRssService,
    ConsumerBrandsAssociationService,
    ThirdwayService,
    ToyAssociationService,
    FdraService,
    MSUService,
    NbcslService,
    NaleoService,
    NhcslService,
    AafaService,
    AntitrustEPService,
    DataInnovationService,
    CenturyFundationService,
    AntitrustInstituteService,
    AllianceAntitrustService,
    TruthMarketService,
    OpenCompetitionService,
    DemocraticWorkplaceService,
    WorkforceFairnessService,
    InstituteAWService,
    AppAssociationService,
  ],
})
export class NonRssModule {}
