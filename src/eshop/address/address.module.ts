import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';

import { AddressModel } from './models/address.model';
import { AddressController } from './controllers/address.controller';
import { AddressService } from './services/address.service';

@Module({
  imports: [SharedModule, AddressModule],
  providers: [AddressModel, AddressService],
  controllers: [AddressController],
})
export class AddressModule {}
