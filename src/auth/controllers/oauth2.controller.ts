import { Controller, Inject, Post, Req, Res, Session } from "@nestjs/common";
import {Request as ExpressRequest, Response as ExpressResponse} from 'express';
import {Request as Oauth2Request, Response as Oauth2Response} from 'oauth2-server';
import { OAUTH2 } from "../oauth2.provider";
import OAuth2Server from "oauth2-server";

@Controller('oauth')
export class Oauth2Controller {
  constructor(
    @Inject(OAUTH2) private server: OAuth2Server,
  ) {
  }

  @Post('/token2')
  async getToken2(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    res.send('adsf')
  }

  @Post('/token')
  async getToken(@Req() req: ExpressRequest, @Res() res: ExpressResponse, @Session() session: Record<string, any>) {
    const request = new Oauth2Request(req);
    const response = new Oauth2Response(res);
    try {
      const result = await this.server.token(request, response);
      // Make sure this matches the old one
      req.session.user = result;
      res.header('x-sess-id', req.session.id);

      // Need to send the response like so cause we're injecting @Req and @Res
      res.json(result);
    }
    catch (e) {
      res.status(500).json({success: false, reason: e.message});
    }
  }

}
