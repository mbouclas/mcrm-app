import { Controller, Get } from "@nestjs/common";

@Controller('/api/crm/admin')
export class BootController {
  @Get('/boot')
  async boot() {
    return 'Blah'
  }
}
