import { Controller, Get } from "@nestjs/common";
import { BootService } from "~admin/boot.service";

@Controller('api/boot')
export class BootController {
  @Get('')
  async boot() {
    return await (new BootService()).boot();
  }
}
