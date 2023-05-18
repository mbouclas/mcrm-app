import { RegularUserInterceptor } from './regular-user.interceptor';

describe('RegularUserInterceptor', () => {
  it('should be defined', () => {
    expect(new RegularUserInterceptor()).toBeDefined();
  });
});
