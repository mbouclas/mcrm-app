import { Controller, Get } from "@nestjs/common";
import { AuthService } from "~root/auth/auth.service";
import { v4 } from 'uuid';
import { CacheService } from "~shared/services/cache.service";

@Controller('auth')
export class AuthController {
  constructor() {
  }
  @Get('otp')
  async getOtp() {
    const authService = new AuthService();
    const id = v4();
    const hashedPassword = await authService.hasher.hashPassword(id);

    await (new CacheService()).put(id, hashedPassword);

    return {
      success: true,
      id,
      otp: hashedPassword
    }
  }
}
