import { Module } from '@nestjs/common';
import { ContactFormsController } from './contact-forms.controller';
import { ContactFormsService } from './contact-forms.service';

@Module({
  controllers: [ContactFormsController],
  providers: [ContactFormsService]
})
export class ContactFormsModule {}
