import { Test, TestingModule } from '@nestjs/testing';
import { MemuController } from './memu.controller';

describe('MemuController', () => {
  let controller: MemuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemuController],
    }).compile();

    controller = module.get<MemuController>(MemuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
