import {
  Logger,
  MiddlewareConsumer,
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger/logger.module';
import { MailModule } from './mail/mail.module';
import { SharedModule } from '~shared/shared.module';
import { UserModule } from '~user/user.module';
import { CrmModule } from '~crm/crm.module';
import { CmsModule } from '~cms/cms.module';
import { SettingModule } from '~setting/setting.module';
import { MarketingManagerModule } from './marketing-manager/marketing-manager.module';
import { PublicModule } from './public/public.module';
import { ServiceDeskModule } from './service-desk/service-desk.module';
import { AdminModule } from '~admin/admin.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { resolve } from 'path';
import { store } from './state';
import { ModelsService } from '~admin/services/models.service';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { CatalogueModule } from '~catalogue/catalogue.module';
import { EshopModule } from '~eshop/eshop.module';
import { DashboardModule } from '~dashboard/dashboard.module';
import { WebsiteModule } from './website/website.module';
import { ChangeLogModule } from '~change-log/change-log.module';
import { TagModule } from '~tag/tag.module';
import { CartMiddleware } from '~eshop/middleware/cart.middleware';
import { UploadModule } from './upload/upload.module';
import { ImageModule } from '~image/image.module';
import { loadConfigs } from '~helpers/load-config';
import { SyncModule } from './sync/sync.module';
import { ClientModule } from './client/client.module';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { FilesModule } from './files/files.module';
import { ClientCodeModule } from "~root/client-code/client-code.module";

const Lang = require('mcms-node-localization');
export let Translate;
export const Test = { token: null };

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      verboseMemoryLeak: true,
      maxListeners: 50,
    }),

    SharedModule,
    SettingModule,
    LoggerModule,
    MailModule,
    // Neo4jModule,
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
    TagModule,
    UploadModule,
    ImageModule,
    SyncModule,
    ClientModule,
    ObjectStorageModule,
    FilesModule,
    ClientCodeModule,
  ],
  exports: [SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);
  public static eventEmitter: EventEmitter2;
  constructor(private eventEmitter: EventEmitter2) {
    AppModule.eventEmitter = this.eventEmitter;
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: 'api*', method: RequestMethod.ALL });

    consumer.apply(CartMiddleware).forRoutes(
      { path: 'cart*', method: RequestMethod.ALL },
      // { path: 'api/order*', method: RequestMethod.ALL },
      { path: 'store*', method: RequestMethod.ALL },
      { path: 'user*', method: RequestMethod.ALL },
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
    /**
     * It should not load during the cli mode cause it will include the main file which boots the server
     */
    if (!process.env.MODE || process.env.MODE !== 'cli') {
      const ViewEngine = require('./main').ViewEngine;
      ViewEngine.options.globals = {
        ...ViewEngine.options.globals,
        ...{
          SITE_NAME: process.env.SITE_TITLE,
          CURRENT_DATE: new Date(),
          CURRENT_YEAR: new Date().getFullYear(),
          isInProduction: process.env.NODE_ENV === 'production',
        },
      };
    }
    /*    */

    Translate = new Lang({
      directory: resolve(__dirname, '../../', 'lang'),
      locales: store.getState().languages.map((lang) => lang.code),
    }).add();

    // Lets load all configs
    await loadConfigs();
    // Now all the client configs
    await loadConfigs('./client-configs', true);

    this.eventEmitter.emit('app.loaded', { success: true });
  }

  async onModuleInit() {
    this.logger.log('AppModule initialized');
  }
}
