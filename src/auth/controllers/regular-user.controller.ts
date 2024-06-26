import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param, Patch,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseInterceptors
} from "@nestjs/common";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import OAuth2Server, { Request as Oauth2Request, Response as Oauth2Response } from "oauth2-server";
import { InvalidCredentials, UserExists } from "~root/auth/exceptions";
import { OAUTH2 } from "~root/auth/oauth2.provider";
import { AuthService, cleanUpUserPayloadForRegularUsers, returnNewGuestUser } from "~root/auth/auth.service";
import { UserService } from "~user/services/user.service";
import { ICheckUserEmailResult } from "~eshop/controllers/store.controller";
import { IsEmail, IsNotEmpty } from "class-validator";
import { OtpInterceptor } from "~root/auth/interceptors/otp.interceptor";
import { GuestInterceptor } from "~root/auth/interceptors/guest.interceptor";
import { getStoreProperty, store } from "~root/state";
import { IGenericObject } from "~models/general";
import { SessionData } from "express-session";
import { IAddress } from "~eshop/models/checkout";
import { AddressService } from "~eshop/address/services/address.service";
import { ISessionData } from "~shared/models/session.model";
import { RecordNotFoundException } from "~shared/exceptions/record-not-found.exception";
import { ExecutorsService } from "~shared/services/executors.service";
import { AuthInterceptor } from "~root/auth/interceptors/auth.interceptor";
import { OrderService } from "~eshop/order/services/order.service";
import { UserOrderInterceptor } from "~eshop/order/interceptors/user-order.interceptor";
import { UserModel } from "~user/models/user.model";
import { RoleModel } from "~user/role/models/role.model";
import { CustomerService } from "~eshop/customer/services/customer.service";
import { UserGroupService } from "~eshop/user-group/user-group.service";
import { OnEvent } from "@nestjs/event-emitter";
const crypto = require('crypto');


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

  @OnEvent('app.loaded')
  async onLoad() {
    const data = {
      "email": "aasd3asd@sqd.asd",
      "userInfo": {
        "email": "aasd3asd@sqd.asd",
        "phone": "sdasd",
        "firstName": "as",
        "lastName": "asd",
        "terms": true
      },
      "jciue": false
    };

    const user = await (new UserService()).registerGuestUser(data.email, data.userInfo, false);

  }

  @Post("/login")
  // @UseInterceptors(RegularUserInterceptor)
  async getToken(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
    @Session() session: ISessionData
  ) {

    const request = new Oauth2Request(req);
    const response = new Oauth2Response(res);

    try {
      const result = await this.server.token(request, response);
      // Make sure this matches the old one
      req.session.user = result;

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
  async logout(@Req() req: ExpressRequest, @Session() session: ISessionData) {
    const token = req.header('Authorization');
    if (!token) {
      return { success: false, message: "Failed to logout user", reason: "100.11" };
    }

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
  @UseInterceptors(OtpInterceptor)
  async register(@Body() data: RegisterGuestDto) {
    const hooks = getStoreProperty("configs.store.users.hooks");
    let existingUser;

    try {
      await ExecutorsService.executeHook(hooks.beforeUserValidation, [data]);
    }
    catch (e) {
      console.log(e.errors)
    }


    try {
      existingUser = await (new UserService()).findOne({
        email: data.email
      });
    } catch (e) {
      const isRecordNotFoundError = e instanceof RecordNotFoundException;
      if (!isRecordNotFoundError) {
        return { success: false, message: e.message };
      }
    }



    if (existingUser) {
      return { success: false, message: 'USER_EXISTS', reason: "100.10" };
    }

    try {
      await ExecutorsService.executeHook(hooks.afterUserValidation, [data]);
    }
    catch (e) {
      console.log(e)
    }


    try {
      await ExecutorsService.executeHook(hooks.beforeUserCreate, [data]);
    }
    catch (e) {
      console.log(e)
    }

    let user;
    try {
      user = await (new CustomerService()).createCustomer(data)
    }
    catch (e) {
      console.log(e)
      return {
        success: false,
        message: "Failed to register user",
        reason: e.message
      };
    }

    try {
      await ExecutorsService.executeHook(hooks.afterUserCreate, [data]);
    }
    catch (e) {
      console.log(e)
    }

    return {
      success: true,
      user: returnNewGuestUser(user)
    };

  }

  @Post("/check-email")
  @UseInterceptors(OtpInterceptor)
  async checkUserEmail(@Body() data: { email: string, userInfo?: IGenericObject, jciue: boolean }, @Req() req: any, @Session() session: ISessionData): Promise<ICheckUserEmailResult> {
    try {
      const user = await new UserService().findOne({ email: data.email });

      if (user.type === 'guest' && !session.user) {
        session.user = user;
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
    // jciue === Just Check If User Exists
    if (!registerGuest || data.jciue) {
      return {
        email: data.email,
        exists: false
      };
    }

    // register the guest user and add it to the session
    const service = new UserService();
    try {
      session.user = await service.registerGuestUser(data.email, data.userInfo, false);
    } catch (e) {
      return {
        email: data.email,
        exists: false,
        error: e.message,
        reason: e.getCode()
      }
    }



    // SharedModule.eventEmitter.emit(CartService.userReadyToAttachEventName, {userId: user.uuid, cart: session.cart});
    return {
      email: data.email,
      exists: false
    };
  }

  @Post("/address/sync")
  @UseInterceptors(OtpInterceptor)
  async syncAddress(@Body() data: AddressSyncDto,@Req() req: any, @Session() session: ISessionData) {



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

  @Get('/verify/:token')
  @UseInterceptors(OtpInterceptor)
  async verifyEmail(@Param('token') token: string) {
    try {
      return await new UserService().verifyEmail(token);
    }
    catch (e) {
      return {success: false, message: e.message, code: e.getCode()};
    }

  }

  @Get('password-reset')
  @UseInterceptors(OtpInterceptor)
  async askForPasswordResetOtp(@Query('email') email: string) {
    try {
      await new UserService().askForPasswordResetOtp(email);
    }
    catch (e) {
      let message;
      switch (e.message) {
        case 'RECORD_NOT_FOUND':
          message = 'EMAIL_NOT_FOUND';
          break;
      }

      return {success: false, message, code: e.getCode()};
    }

    return {success: true}
  }

  @Get('verify-reset-otp')
  @UseInterceptors(OtpInterceptor)
  async verifyPasswordResetOtp(@Query('email') email: string, @Query('otp') otp: string) {
    try {
      await new UserService().verifyPasswordResetOtp(email, otp);
    }
    catch (e) {
      let message;
      switch (e.message) {
        case 'RECORD_NOT_FOUND':
          message = 'INCORRECT_RESET_CODE';
          break;
      }

      return {success: false, message, code: e.getCode()};
    }

    return {success: true}
  }

  @Post('change-password')
  @UseInterceptors(OtpInterceptor)
  async changePassword(@Body() data: {password: string, email: string}) {
    try {
      await new UserService().changeUserPassword(data.email, data.password);
    }
    catch (e) {
      return {success: false, message: e.message, code: e.getCode()};
    }

    return {success: true};
  }

  @Get('orders')
  @UseInterceptors(AuthInterceptor)
  @UseInterceptors(UserOrderInterceptor)
  async getOrders(@Session() session: ISessionData) {
    try {
      return await new OrderService().find({userId: session.user.uuid});
    }
    catch (e) {
      return {success: false, message: e.message, code: e.getCode()};
    }
  }

  @Get('account')
  @UseInterceptors(AuthInterceptor)
  async getAccount(@Session() session: ISessionData) {
    const userService = new UserService();
    const user = await userService.findOne({ email: session.user.email }, ["address", "role"]);

    if (!user && !userService.isGuest(user)) {
      return { success: false, message: "Could not get user details", reason: "500.9.1" };
    } else if (user && !userService.isGuest(user)) {
      return {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address
      }
    }

    return user;
  }

  @Patch('address/default/:addressId')
  async setDefaultAddress(@Param('addressId') addressId: string, @Session() session: ISessionData) {
    try {
      await new AddressService().setDefaultAddress(addressId, session.user.uuid);
    }
    catch (e) {
      return {success: false, message: e.message, code: e.getCode()};
    }

    return {success: true};
  }

  @Delete('address/:addressId')
  async deleteAddress(@Param('addressId') addressId: string, @Session() session: ISessionData) {
    try {
      await new AddressService().deleteAddress(addressId);
    }
    catch (e) {
      return {success: false, message: e.message, code: e.getCode()};
    }

    return {success: true};
  }

  @Post('address')
  async addAddress(@Body() data: AddressSyncDto, @Session() session: ISessionData) {
    if (!AddressService.validateAddress(data.address)) {
      return {success: false, message: "Invalid address"};
    }

    try {
      const res = await (new AddressService()).attachAddressToUser(data.address, session.user.uuid);
      data['uuid'] = res.uuid;
    }
    catch (e) {
      console.log(e)
      return {success: false, message: e.message, code: e.getCode()};
    }


    return data;
  }
}
