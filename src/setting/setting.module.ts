import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';
import { ConditionModule } from '~setting/condition/condition.module';

@Module({
  imports: [SharedModule, ConditionModule],
})
export class SettingModule { }
