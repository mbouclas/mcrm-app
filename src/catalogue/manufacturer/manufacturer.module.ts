import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';

import { ManufacturerModel } from './models/manufacturer.model';
import { ManufacturerController } from './controllers/manufacturer.controller';
import { ManufacturerService } from './services/manufacturer.service';

@Module({
  imports: [SharedModule, ManufacturerModule],
  providers: [ManufacturerModel, ManufacturerService],
  controllers: [ManufacturerController],
})
export class ManufacturerModule {}
