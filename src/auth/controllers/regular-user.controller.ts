import { Body, Controller, Delete, Inject, Param, Post, Req, Res, Session, UseInterceptors } from "@nestjs/common";
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
import { store } from "~root/state";
import { IGenericObject } from "~models/general";
import { SessionData } from "express-session";
import { IAddress } from "~eshop/models/checkout";
import { AddressService } from "~eshop/address/services/address.service";
import { UserSession } from "~eshop/middleware/cart.middleware";
import { SharedModule } from "~shared/shared.module";
import { CartService } from "~eshop/cart/cart.service";
import { CacheService } from "~shared/services/cache.service";


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

export class AddressSyncDto {
  @IsNotEmpty()
  address: IAddress;

  @IsNotEmpty()
  type: 'SHIPPING'|'BILLING' | 'OTHER'
}

@Controller("user")
export class RegularUserController {

  constructor(
    @Inject(OAUTH2) private server: OAuth2Server,

  ) {

  }

  @Post("/login")
  // @UseInterceptors(RegularUserInterceptor)
  async getToken(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    const Session = new UserSession(req),
      session: SessionData = await Session.get();
    const request = new Oauth2Request(req);
    const response = new Oauth2Response(res);

    try {
      const result = await this.server.token(request, response);
      // Make sure this matches the old one
      req.session.user = result;
      await Session.update('user', result);
      res.header("x-sess-id", req.session.id);

      const userService = new UserService();
      result.user = await userService.findOne({ uuid: result.user.uuid }, ["address"]);

      // Need to send the response like so cause we're injecting @Req and @Res
      res.json(cleanUpUserPayloadForRegularUsers(result));
    } catch (e) {
      throw new InvalidCredentials();
    }
  }

  @Delete("/logout/")
  async logout(@Req() req: ExpressRequest) {
    const token = req.header('Authorization');
    if (!token) {
      return { success: false, message: "Failed to logout user", reason: "100.11" };
    }

    const Session = new UserSession(req),
      session: SessionData = await Session.get();

    await Session.update('user', {});
    req.session.user = {};

    try {
      await (new AuthService()).logout(token);
    }
    catch (e) {
      return { success: false, message: "Failed to logout user", reason: e.message };
    }

    return {success: true};
  }

  @Post("details")
  @UseInterceptors(OtpInterceptor)
  @UseInterceptors(GuestInterceptor)
  async getGuestDetails(@Body() data: { email: string }, @Req() req: any) {
    const session: SessionData = req.userSession;
    const userService = new UserService();
    const user = await userService.findOne({ email: data.email }, ["address", "role"]);

    if (!userService.isGuest(user)) {
      return { success: false, message: "Could not get user details", reason: "500.9" };
    }

    if (user.type === 'guest' && !session.user) {
      session.user = user;
    }

    return { ...{ success: true }, ...user };
  }

  @Post("/register")
  async register(@Body() data: RegisterGuestDto) {
    const userService = new UserService();
    try {
      await (new UserService()).findOne({
        email: data.email
      });
    } catch (e) {
      return { success: false, message: "User already exists" };
    }

    const authService = new AuthService();
    const hashedPassword = await authService.hasher.hashPassword(data.password);

    const confirmToken = crypto
      .createHash("sha256")
      .update(data.email)
      .digest("hex");


    try {
      const user = await userService.store({
        ...data,
        password: hashedPassword,
        confirmToken,
        type: "guest",
        active: false
      });

      return {
        success: true,
        user: returnNewGuestUser(user)
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to register user",
        reason: e.message
      };
    }

  }

  @Post("/check-email")
  @UseInterceptors(OtpInterceptor)
  async checkUserEmail(@Body() data: { email: string, userInfo?: IGenericObject }, @Req() req: any): Promise<ICheckUserEmailResult> {
    const Session = new UserSession(req),
      session: SessionData = await Session.get();

    try {
      const user = await new UserService().findOne({ email: data.email });

      if (user.type === 'guest' && !session.user) {
        await Session.update('user',user);
      }

      // SharedModule.eventEmitter.emit(CartService.userReadyToAttachEventName, {userId: user.uuid, cart: session.cart});

      return {
        email: data.email,
        type: user.type || "user",
        exists: true
      };
    } catch (e) {
      // no user found
    }

    const registerGuest = store.getState().configs["store"]["users"]["registerGuests"];
    if (!registerGuest) {
      return {
        email: data.email,
        exists: false
      };
    }

    // register the guest user and add it to the session
    const service = new UserService();
    let user;
    try {
      user = await service.registerGuestUser(data.email, data.userInfo);
    } catch (e) {
      return {
        email: data.email,
        exists: false,
        error: e.message,
        reason: e.getCode()
      }
    }

    await Session.update('user',user);

    // SharedModule.eventEmitter.emit(CartService.userReadyToAttachEventName, {userId: user.uuid, cart: session.cart});
    return {
      email: data.email,
      exists: false
    };
  }

  @Post("/address/sync")
  @UseInterceptors(OtpInterceptor)
  async syncAddress(@Body() data: AddressSyncDto,@Req() req: any) {
    const Session = new UserSession(req),
    session: SessionData = await Session.get();

    if (!session.user || !session.user.uuid) {
      return {success: false, message: "User not found"};
    }

    if (!AddressService.validateAddress(data.address)) {
      return {success: false, message: "Invalid address"};
    }

    try {
      const res = await (new AddressService()).attachAddressToUser(data.address, session.user.uuid, data.type.toUpperCase() as unknown as any);
      data['uuid'] = res.uuid;
    }
    catch (e) {
      console.log(e)
      return {success: false, message: e.message, code: e.getCode()};
    }


    return data;
  }
}
