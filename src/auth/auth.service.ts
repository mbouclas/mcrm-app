import { compare, genSalt, hash } from "bcryptjs";
import { IOauthToken } from "~models/auth";
import OAuth2Server from "oauth2-server";

export type HashPassword = (
  password: string,
  rounds: number,
) => Promise<string>;

export interface PasswordHasher<T = string> {
  hashPassword(password: T): Promise<T>;
  comparePassword(providedPass: T, storedPass: T): Promise<boolean>;
}

export interface IOauthSessionCookie  {
  cookie: {};
  token: IOauthToken;
}

export async function hashPassword(
  password: string,
  rounds: number,
): Promise<string> {
  const salt = await genSalt(rounds);
  return await hash(password, salt);
}

export class BcryptHasher implements PasswordHasher<string> {
  constructor(
    private readonly rounds: number
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.rounds);
    return await hash(password, salt);
  }

  async comparePassword(
    providedPass: string,
    storedPass: string,
  ): Promise<boolean> {
    return  await compare(providedPass, storedPass);

  }

}

export class AuthService {
  public hasher: BcryptHasher;
  private resetKeyPrefix = 'reset-';

  constructor() {
    this.hasher = new BcryptHasher(10);
  }

}

export function cleanUpUserPayloadForRegularUsers(value: OAuth2Server.Token) {
  const user = {
    email : value.user.email,
    firstName : value.user.firstName,
    lastName : value.user.lastName,
    gates: value.user.gates,
    addresses: value.user['address'] ? value.user['address'].map(a => {
      Object.keys(a).forEach(k => {
        if (k === 'uuid') {
          delete a[k];
        }
      });

      return a;
    }) : [],
  };

  const tokens = {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    accessTokenExpiresAt: value.accessTokenExpiresAt,
    refreshTokenExpiresAt: value.refreshTokenExpiresAt,
  };

  return {
    ...tokens,
    ...user,
  }
}
