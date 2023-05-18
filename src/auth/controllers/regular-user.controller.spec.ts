import { Test, TestingModule } from '@nestjs/testing';
import { RegularUserController } from './regular-user.controller';

describe('RegularUserController', () => {
  let controller: RegularUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegularUserController],
    }).compile();

    controller = module.get<RegularUserController>(RegularUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
