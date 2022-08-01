import {
  Logger,
  MiddlewareConsumer,
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
  RequestMethod
} from "@nestjs/common";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger/logger.module';
import { MailModule } from './mail/mail.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './user/user.module';
import { CrmModule } from './crm/crm.module';
import { CmsModule } from './cms/cms.module';
import { MarketingManagerModule } from './marketing-manager/marketing-manager.module';
import { PublicModule } from './public/public.module';
import { ServiceDeskModule } from './service-desk/service-desk.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from "@nestjs/config";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { AuthModule } from './auth/auth.module';
import { ViewEngine } from "./main";
import { resolve } from "path";
import { store } from "./state";
import { ModelsService } from "./admin/services/models.service";
import { AuthMiddleware } from "./auth/middleware/auth.middleware";
import { CatalogueModule } from './catalogue/catalogue.module';
import { EshopModule } from './eshop/eshop.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebsiteModule } from './website/website.module';
import { ChangeLogModule } from './change-log/change-log.module';
const Lang = require('mcms-node-localization');
export let Translate;
export let Test = {token: null};

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: ".",
      verboseMemoryLeak: true
    }),
    SharedModule,
    LoggerModule,
    MailModule,
    // Neo4jModule,
    SharedModule,
    UserModule,
    CrmModule,
    CmsModule,
    MarketingManagerModule,
    PublicModule,
    ServiceDeskModule,
    AdminModule,
    CommonModule,
    AuthModule,
    CatalogueModule,
    EshopModule,
    DashboardModule,
    WebsiteModule,
    ChangeLogModule,
  ],
  exports: [
    SharedModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
  ],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(private eventEmitter: EventEmitter2) {
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        AuthMiddleware,
      )
      .forRoutes(
        { path: "api*", method: RequestMethod.ALL }
      );
  }

  /**
   * All boot operations here
   */
  async onApplicationBootstrap() {
    SharedModule.eventEmitter = this.eventEmitter;
    // const models = await this.modelService.getModels();
    const modelService: ModelsService = AdminModule.getService(ModelsService);
    await modelService.mergeModels();
// Object.keys(store.getState().models).forEach(model => console.log(model))
//     console.log(store.getState().models['Product']);

    ViewEngine.options.globals = { ...ViewEngine.options.globals,
      ...{SITE_NAME: process.env.SITE_TITLE, isInProduction: process.env.NODE_ENV === 'production'}};

    Translate = new Lang({
      directory : resolve(__dirname, '../../', 'lang'),
      locales : store.getState().languages.map(lang => lang.code),
    }).add();

    this.eventEmitter.emit('app.loaded', {success: true});
  }



  async onModuleInit() {
    this.logger.log("AppModule initialized");

  }
}
