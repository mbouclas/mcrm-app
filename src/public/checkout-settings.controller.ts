import { Controller, Get } from "@nestjs/common";

@Controller('checkout-settings')
export class CheckoutSettingsController {
  @Get('')
  async getSettings() {
    return {
      shipping: [],
      payment: [],

    }

  }
}
