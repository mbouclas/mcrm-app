import { Controller, Get } from "@nestjs/common";
import { MenuService } from "~website/menu/menu.service";

@Controller('sync/astro/menus')
export class MenusSyncAstroService {
  @Get('')
  async all() {
    return (new MenuService()).find({orderBy: 'order', way: 'asc'}, ['itemTree']);
  }
}
