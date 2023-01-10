import { Controller, Inject, Post, Req, Res, Session } from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  Request as Oauth2Request,
  Response as Oauth2Response,
} from 'oauth2-server';
import { OAUTH2 } from '../oauth2.provider';
import OAuth2Server from 'oauth2-server';

import { Body } from '@nestjs/common';
import { IGenericObject } from '~models/general';
import { UserService } from '~user/services/user.service';
import handleAsync from '~helpers/handleAsync';
import { AuthService, hashPassword } from '~root/auth/auth.service';
const crypto = require('crypto');

@Controller('oauth')
export class Oauth2Controller {
  constructor(@Inject(OAUTH2) private server: OAuth2Server) {}

  @Post('/token2')
  async getToken2(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    res.send('adsf');
  }

  @Post('/token')
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

      // Need to send the response like so cause we're injecting @Req and @Res
      res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, reason: e.message });
    }
  }

  @Post('/register')
  async register(@Body() body: IGenericObject) {
    const [error, userExists] = await handleAsync(
      new UserService().findOne({
        email: body.email,
      }),
    );

    if (userExists) {
      throw new Error('User exists');
    }

    const authService = new AuthService();

    const hashedPassword = await authService.hasher.hashPassword(body.password);

    const confirmToken = crypto
      .createHash('sha256')
      .update(body.email)
      .digest('hex');

    const user = await new UserService().store({
      ...body,
      password: hashedPassword,
      confirmToken,
      active: false,
    });

    return { success: true };
  }

  @Post('/confirm-email')
  async confirmEmail(@Body() body: IGenericObject) {
    try {
      const [error, userExists] = await handleAsync(
        new UserService().findOne({
          confirmToken: body.confirmToken,
        }),
      );

      if (error) {
        throw new Error('Incorrect user token');
      }

      await new UserService().update(userExists.uuid, {
        active: true,
        confirmToken: null,
      });

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
