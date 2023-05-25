import { OtpMiddleware } from './otp.middleware';

describe('OtpMiddleware', () => {
  it('should be defined', () => {
    expect(new OtpMiddleware()).toBeDefined();
  });
});
