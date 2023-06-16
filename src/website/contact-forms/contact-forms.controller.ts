import { Body, Controller, Post } from "@nestjs/common";
import { ContactFormsService } from "~website/contact-forms/contact-forms.service";

@Controller('contact')
export class ContactFormsController {
  constructor(private readonly contactService: ContactFormsService) {
  }
  @Post()
  async contactForm(@Body() data: any) {
    try {
      return await this.contactService.submitContactForm(data);
    }
    catch (e) {
      return {success: false, message: e.message};
    }
  }
}
