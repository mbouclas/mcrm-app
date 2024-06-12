import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { ContactFormsService } from "~website/contact-forms/contact-forms.service";
import { OtpInterceptor } from "~root/auth/interceptors/otp.interceptor";

@Controller('contact')
export class ContactFormsController {
  constructor(private readonly contactService: ContactFormsService) {
  }
  @Post()
  @UseInterceptors(OtpInterceptor)
  async contactForm(@Body() data: any) {
    try {
      return await this.contactService.submitContactForm(data);
    }
    catch (e) {
      return {success: false, message: e.message};
    }
  }

  @Post('request-price')
  @UseInterceptors(OtpInterceptor)
  async requestPrice(@Body() data: any) {
    try {
      return await this.contactService.requestPrice(data);
    }
    catch (e) {
      return {success: false, message: e.message};
    }
  }
}
