import { Module } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';
import { ModelManagerController } from './model-manager.controller';

@Module({
  providers: [ModelManagerService],
  controllers: [ModelManagerController]
})
export class ModelManagerModule {}
