import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';
import { MailService } from './services/mail.service';

@Module({
  imports: [SharedModule],
  providers: [MailService],
  controllers: [],
})
export class MailModule {}
