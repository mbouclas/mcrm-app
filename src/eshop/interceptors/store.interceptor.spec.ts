import { StoreInitialQueryInterceptor } from './store-initial-query.interceptor';

describe('StoreInterceptor', () => {
  it('should be defined', () => {
    expect(new StoreInitialQueryInterceptor()).toBeDefined();
  });
});
