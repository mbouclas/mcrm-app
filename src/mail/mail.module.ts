import { Module } from '@nestjs/common';
import { SharedModule } from '~shared/shared.module';
import { MailService } from './services/mail.service';
import { MailQueueService } from "~root/mail/queues/mail.queue.service";

@Module({
  imports: [SharedModule],
  providers: [
    MailService,
    MailQueueService,
  ],
  controllers: [

  ],
})
export class MailModule {}
