import { Controller, Get, Res } from "@nestjs/common";
import { AppService } from './app.service';
import { Response } from 'express';
import { resolve } from "path";
import { publicDir } from "~root/main";

@Controller('*')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  handleNotFound(@Res() res: Response) {
    res.sendFile(resolve(publicDir, 'index.html'));
  }
}
