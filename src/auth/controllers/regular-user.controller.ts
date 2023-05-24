import { Body, Controller, Delete, Get, Inject, Post, Req, Res, Session, UseInterceptors } from "@nestjs/common";
import { RegularUserInterceptor } from "~root/auth/interceptors/regular-user.interceptor";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import OAuth2Server, { Request as Oauth2Request, Response as Oauth2Response } from "oauth2-server";
import { InvalidCredentials, UserExists } from "~root/auth/exceptions";
import { OAUTH2 } from "~root/auth/oauth2.provider";
import { AuthService, cleanUpUserPayloadForRegularUsers, returnNewGuestUser } from "~root/auth/auth.service";
import { UserService } from "~user/services/user.service";
import { ICheckUserEmailResult } from "~eshop/controllers/store.controller";
import { IsEmail, IsNotEmpty } from "class-validator";
import crypto from "crypto";
import { OtpInterceptor } from "~root/auth/interceptors/otp.interceptor";
import { GuestInterceptor } from "~root/auth/interceptors/guest.interceptor";

export class RegisterGuestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  password: string;

}

@Controller('user')
export class RegularUserController {
  constructor(@Inject(OAUTH2) private server: OAuth2Server) {}

  @Post('/login')
  // @UseInterceptors(RegularUserInterceptor)
  async getToken(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
    @Session() session: Record<string, any>,
  ) {
    const request = new Oauth2Request(req);
    const response = new Oauth2Response(res);

    try {
      const result = await this.server.token(request, response);
      // Make sure this matches the old one
      req.session.user = result;
      res.header('x-sess-id', req.session.id);

      const userService = new UserService();
      result.user = await userService.findOne({uuid: result.user.uuid }, ['address']);

      // Need to send the response like so cause we're injecting @Req and @Res
      res.json(cleanUpUserPayloadForRegularUsers(result));
    } catch (e) {
      throw new InvalidCredentials();
    }
  }

  @Delete('/logout/:token')
  async logout(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {

  }

  @Post('details')
  @UseInterceptors(OtpInterceptor)
  @UseInterceptors(GuestInterceptor)
  async getGuestDetails(@Body() data: {email: string}) {
    const userService = new UserService();
    const user = await userService.findOne({email: data.email}, ['address', 'role']);

    if (!userService.isGuest(user)) {
      return {success: false, message: 'Could not get user details', reason: '500.9'};
    }
    return {...{success: true}, ...user};
  }

  @Post('/register')
  async register(@Body() data: RegisterGuestDto) {
    const userService = new UserService();
    try {
      await (new UserService()).findOne({
        email: data.email,
      });
    }
    catch (e) {
      return {success: false, message: 'User already exists'};
    }

    const authService = new AuthService();
    const hashedPassword = await authService.hasher.hashPassword(data.password);

    const confirmToken = crypto
      .createHash('sha256')
      .update(data.email)
      .digest('hex');


    try {
      const user = await userService.store({
        ...data,
        password: hashedPassword,
        confirmToken,
        type: 'guest',
        active: false,
      });

      return {
        success: true,
        user: returnNewGuestUser(user)
      }
    }
    catch (e) {
      return {
        success: false,
        message: 'Failed to register user',
        reason: e.message,
      }
    }

  }

  @Post('/check-email')
  async checkUserEmail(@Body() data: {email: string}): Promise<ICheckUserEmailResult> {
    try {
      const user = await new UserService().findOne({email: data.email});
      return {
        email: data.email,
        type: user.type || 'user',
        exists: true
      }
    }
    catch (e) {
      return {
        email: data.email,
        exists: false
      }
    }

  }
}
