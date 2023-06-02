import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';
import { PropertyModel } from './models/property.model';
import { PropertyValueModel } from './models/property-value.model';
import { PropertyService } from './services/property.service';
import { PropertyController } from './controllers/property.controller';
import { PropertyValueService } from './services/propertyValue.service';

@Module({
  imports: [SharedModule],
  providers: [PropertyModel, PropertyValueModel, PropertyService, PropertyValueService],
  controllers: [PropertyController],
})
export class PropertyModule {}
