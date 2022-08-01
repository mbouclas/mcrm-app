import { Test, TestingModule } from '@nestjs/testing';
import { BootController } from './boot.controller';

describe('BootController', () => {
  let controller: BootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BootController],
    }).compile();

    controller = module.get<BootController>(BootController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
