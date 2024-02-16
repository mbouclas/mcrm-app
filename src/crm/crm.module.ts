import { Module } from '@nestjs/common';
import { BusinessModel } from "./models/business.model";
import { IndexToEsCommand } from "./cli/indexToEs.command";
import { BootController } from './controllers/admin/boot.controller';
import { PersonModel } from "./models/person.model";
import { PersonService } from "~crm/services/person.service";
import { BusinessController } from './controllers/business.controller';
import { PersonController } from './controllers/person.controller';
import { AccountController } from './controllers/account.controller';
import { BusinessCategoryController } from './controllers/business-category.controller';
import { SettingsController } from './controllers/settings.controller';
import { BusinessCategoryService } from './services/business-category.service';
import { BusinessCategoryModel } from "~crm/models/business-category.model";
import { AccountModel } from "~crm/models/account.model";

@Module({
  providers: [
    BusinessModel,
    BusinessCategoryModel,
    PersonModel,
    AccountModel,
    IndexToEsCommand,
    PersonModel,
    PersonService,
    BusinessCategoryService,
  ],
  controllers: [BusinessController, BootController, PersonController, AccountController, BusinessCategoryController, SettingsController]
})
export class CrmModule {}
