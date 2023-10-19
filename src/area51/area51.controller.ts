import { Body, Controller, Get, Post } from "@nestjs/common";
import { Area51Service } from "~root/area51/area51.service";

@Controller('api/area51')
export class Area51Controller {
  @Get('data')
  async getData() {
    const service = new Area51Service();
    return await service.find({});
  }

  @Post('fields')
  async saveFields(@Body() data: any) {
    const service = new Area51Service();
    if (data.uuid) {
      return await service.update(data.uuid, data);
    }

    return await service.store(data);
  }
}
