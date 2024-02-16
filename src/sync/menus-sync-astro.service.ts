import { Controller, Get } from "@nestjs/common";
import { MenuService } from "~website/menu/menu.service";

@Controller('sync/astro/menus')
export class MenusSyncAstroService {
  onApplicationBootstrap() {
    setTimeout(async () => {
      const a = await (new MenuService()).find({orderBy: 'order', way: 'asc'}, ['itemTree']);

    }, 1000);
  }
  @Get('')
  async all() {
    return (new MenuService()).find({orderBy: 'order', way: 'asc'}, ['itemTree']);
  }
}
