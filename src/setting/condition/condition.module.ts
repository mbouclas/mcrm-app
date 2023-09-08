import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';

import { ConditionModel } from './models/condition.model';
import { ConditionController } from './controllers/condition.controller';
import { ConditionService } from './services/condition.service';

@Module({
  imports: [SharedModule, ConditionModule],
  providers: [ConditionModel, ConditionService],
  controllers: [ConditionController],
})
export class ConditionModule { }
