import { Controller, Get, Param, Post } from "@nestjs/common";
import { PreviewService } from "~website/previews/preview.service";
import {
  CouldNotGeneratePreviewUrlHttpException
} from "~website/previews/exceptions/CouldNotGeneratePreviewUrlHttp.exception";
import BaseHttpException from "~shared/exceptions/base-http-exception";

@Controller('api/previews')
export class PreviewController {
  onApplicationBootstrap() {
/*    setTimeout(async () => {
      const s = new PreviewService();
      try {
        const res = await s.checkIfPreviewServerIsRunning();
        // const res = await s.generatePreviewUrl('Product','97ff6edd-af46-4b66-8af2-189be6efcac4');
        console.log(res)
      }
      catch (e) {
        console.log(e);
      }

    }, 2000);*/
  }
  @Get('dumpData')
  async dumpData() {
    try {
      return {success: await new PreviewService().dumpData()};
    }
    catch (e) {
      console.log(e)
      throw new BaseHttpException({
        error: e.message,
        reason: 'COULD_NOT_DUMP_DATA',
        code: '1500.1',
        statusCode: 500
      })
    }
  }

  @Get('generatePreviewUrl/:module/:itemId')
  async generatePreviewUrl(@Param('module') modelName: string, @Param('itemId') itemId: string) {
    try {
      return {url: await new PreviewService().generatePreviewUrl(modelName,itemId)};
    }
    catch (e) {
      throw new CouldNotGeneratePreviewUrlHttpException(e);
    }
  }

}
