import { Module } from '@nestjs/common';
import { GateModel } from './models/gate.model';
import { GateService } from './services/gate.service';
import { GateController } from './controllers/gate.controller';

@Module({
  controllers: [GateController],
  providers: [GateModel, GateService],
})
export class GateModule {}
