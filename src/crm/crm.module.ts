import { Module } from '@nestjs/common';
import { BusinessModel } from "./models/business.model";
import { IndexToEsCommand } from "./cli/indexToEs.command";
import { BusinessController } from './controllers/admin/business/business.controller';
import { BootController } from './controllers/admin/boot.controller';
import { PersonModel } from "./models/person.model";
import { PersonService } from "~crm/services/person.service";

@Module({
  providers: [
    BusinessModel,
    IndexToEsCommand,
    PersonModel,
    PersonService,
  ],
  controllers: [BusinessController, BootController]
})
export class CrmModule {}
