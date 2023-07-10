import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ImageService } from "~image/image.service";
import { IItemImage } from "~image/models/image.types";

@Controller('api/image')
export class ImageController {
  @Delete(':uuid')
  async deleteImage(@Param('uuid') uuid: string) {
    await (new ImageService()).delete(uuid);

    return {success: true};
  }

  @Post('update-order')
  async updateImagesOrder(@Body() payload: {images: Array<{id: string, order: number}>, model: string, modelId: string}) {
    const res = await (new ImageService()).updateImagesOrder(payload.model, payload.modelId, payload.images as IItemImage[]);

    return {success: true, res};
  }

  @Post(':uuid/set-main')
  async setImageAsMain(@Param('uuid') uuid: string, @Body() payload: {model: string, modelId: string}) {
    const res = await (new ImageService()).setImageAsDefault(uuid, payload.model, payload.modelId);

    return {success: true, res};
  }

  @Patch(':uuid/details')
  async updateImageDetails(@Param('uuid') uuid: string, @Body() payload: {details: any, model: string, modelId: string}) {
    const res = await (new ImageService()).updateImageDetails(uuid, payload.model, payload.modelId, payload.details);

    return {success: true, res};
  }
}
