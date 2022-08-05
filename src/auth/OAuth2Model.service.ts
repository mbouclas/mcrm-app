import { Injectable } from "@nestjs/common";
import * as moment from "moment";
import { PasswordModel, Token, Callback, Falsey, Client, User } from "oauth2-server";
import { CacheService } from "~shared/services/cache.service";
import { UserService } from "~user/services/user.service";
import { AuthService } from "~root/auth/auth.service";
const debug = require('debug')('mcms:cache:service');

@Injectable()
export class OAuth2ModelService implements PasswordModel {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService();
  }

  toObject(): PasswordModel {
    return {
      getAccessToken: this.getAccessToken.bind(this),
      getClient: this.getClient.bind(this),
      saveToken: this.saveToken.bind(this),
      getUser: this.getUser.bind(this),
      verifyScope: this.validateScope.bind(this),
    }
  }

  validateScope(user: User, client: Client, scope: string | string[], callback?: Callback<string | Falsey>): Promise<string | string[] | Falsey> {
    debug(8)
    return
  }

  async generateAccessToken(client: Client, user: User, scope: string | string[], callback?: Callback<string>): Promise<string> {
    debug(7)
    return 'asas'
  }

  /**
   * Called when we're trying to validate an access_token
   * @param accessToken
   */
  async getAccessToken(accessToken: string): Promise<Token | Falsey> {
    debug(5);
    const result = await this.cache.get(`token-${accessToken}`);

    if (!result || result.accessToken !== accessToken) {
      return false;
    }

    //Requires a date object but they are stored as strings
    result.refreshTokenExpiresAt = moment(result.refreshTokenExpiresAt).toDate();
    result.accessTokenExpiresAt = moment(result.accessTokenExpiresAt).toDate();

    return result;
  }

  /**
   * This is the first method we hit when asking for a token
   * Must return a valid Oauth2 Client
   * @param clientId
   * @param clientSecret
   */
  async getClient(clientId: string, clientSecret: string): Promise<Client | Falsey> {
    debug(2)
    return {
      id: 'client1',
      grants: [
        'password',
        'refresh_token',
        'client_credentials'
      ],
    };
  }

  /**
   * This is the second stop when we want to generate a token. Invoked to retrieve a user using a username/password combination.
   * @param username
   * @param password
   */
  async getUser(username: string, password: string): Promise<User | Falsey> {
    debug(1)
    let user;
    try {
      user = await (new UserService()).findOne({email: username, active: true}, ['role'], ['gates']);
    }
    catch (e) {
      console.log(e)
    }

    if (!user) {
      return false;
    }

    if (!user.password) {
      return false;
    }

    const authService = new AuthService();

    if (!await authService.hasher.comparePassword(password, user.password)) {
      return false;
    }

    delete user.password;

    return user;
  }


  /**
   * This is used for client credentials. We need to validate the incoming email (from the Client) against something from the User maybe?
   * @param user
   */
  async getUserFromClient(user: User): Promise<User | Falsey> {
    debug(10)
    if (!user) {
      return false;
    }

    return user;
  }

  /**
   * Fourth part of generate token. Invoked to save an access token and optionally a refresh token, depending on the grant type.
   * @param token
   * @param client
   * @param user
   */
  async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
    debug(3)
    const toSave = {
      ...token,
      client,
      user,
    };
    await this.cache.put(`token-${token.accessToken}`, toSave);
    return toSave;
  }

  verifyScope(token: Token, scope: string | string[], callback?: Callback<boolean>): Promise<boolean> {
    debug(4)
    return Promise.resolve(false);
  }
}
