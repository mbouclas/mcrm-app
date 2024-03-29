import { Body, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";

@Controller('upload')
export class UploadController {
  @Post('file')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {

    // return an uploadURL property. At this stage the file is stored locally on the server. It will go to the cloud later once the order is placed
    return files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
    }));
  }
}
