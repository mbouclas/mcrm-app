import { Module } from '@nestjs/common';
import { OAuth2ModelService } from "./OAuth2Model.service";
import { Oauth2Controller } from './controllers/oauth2.controller';
import { oauth2Provider } from "./oauth2.provider";
import { SharedModule } from "../shared/shared.module";
import { GateService } from './gate.service';

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
    Oauth2Controller
  ],
  exports: [
    oauth2Provider,
    OAuth2ModelService,
  ]
})
export class AuthModule {}
