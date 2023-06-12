import { Controller, Get,  Query } from "@nestjs/common";
import { FilesService } from "~files/files.service";

@Controller('api/files')
export class FilesController {
  @Get('get')
  async get(@Query('filename') filename: string) {
    const service = new FilesService();

    try {
      return await service.getFile({ filename });
    }
    catch (e) {
      return {success: false, error: e.message};
    }

  }
}
