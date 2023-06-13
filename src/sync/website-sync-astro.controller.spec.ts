import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteSyncAstroController } from './website-sync-astro.controller';

describe('WebsiteSyncAstroController', () => {
  let controller: WebsiteSyncAstroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteSyncAstroController],
    }).compile();

    controller = module.get<WebsiteSyncAstroController>(WebsiteSyncAstroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
