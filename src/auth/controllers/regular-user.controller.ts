import { Controller, Delete, Inject, Post, Req, Res, Session, UseInterceptors } from "@nestjs/common";
import { RegularUserInterceptor } from "~root/auth/interceptors/regular-user.interceptor";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import OAuth2Server, { Request as Oauth2Request, Response as Oauth2Response } from "oauth2-server";
import { InvalidCredentials } from "~root/auth/exceptions";
import { OAUTH2 } from "~root/auth/oauth2.provider";
import { cleanUpUserPayloadForRegularUsers } from "~root/auth/auth.service";
import { UserService } from "~user/services/user.service";

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
}
