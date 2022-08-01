import { compare, genSalt, hash } from "bcryptjs";
import { IOauthToken } from "~models/auth";

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
