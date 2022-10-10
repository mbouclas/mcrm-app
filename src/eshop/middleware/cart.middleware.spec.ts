import { CartMiddleware } from './cart.middleware';

describe('CartMiddleware', () => {
  it('should be defined', () => {
    expect(new CartMiddleware()).toBeDefined();
  });
});
