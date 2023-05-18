import { Module } from '@nestjs/common';
import { OAuth2ModelService } from "./OAuth2Model.service";
import { Oauth2Controller } from './controllers/oauth2.controller';
import { oauth2Provider } from "./oauth2.provider";
import { SharedModule } from "../shared/shared.module";
import { GateService } from './gate.service';
import { RegularUserController } from './controllers/regular-user.controller';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    oauth2Provider,
    OAuth2ModelService,
    GateService,
  ],
  controllers: [
    Oauth2Controller,
    RegularUserController
  ],
  exports: [
    oauth2Provider,
    OAuth2ModelService,
  ]
})
export class AuthModule {}
