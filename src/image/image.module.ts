import { Module } from '@nestjs/common';
import { ImageService } from "~image/image.service";
import { ImageModel } from "~image/models/image.model";
import { CloudinaryProvider } from "~image/providers/cloudinary.provider";



@Module({
  providers: [
    ImageService,
    ImageModel,
    CloudinaryProvider,
  ]
})
export class ImageModule {}
