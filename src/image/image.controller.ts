import { Controller, Delete, Param } from "@nestjs/common";
import { ImageService } from "~image/image.service";

@Controller('api/image')
export class ImageController {
  @Delete(':uuid')
  async deleteImage(@Param('uuid') uuid: string) {
    await (new ImageService()).delete(uuid);

    return {success: true};
  }
}
