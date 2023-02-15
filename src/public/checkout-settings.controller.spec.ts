import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutSettingsController } from './checkout-settings.controller';

describe('CheckoutSettingsController', () => {
  let controller: CheckoutSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutSettingsController],
    }).compile();

    controller = module.get<CheckoutSettingsController>(CheckoutSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
