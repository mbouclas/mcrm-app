import { OAuth2ModelService } from "./OAuth2Model.service";
import * as OAuth2Server from "oauth2-server";

export const OAUTH2 = 'OAUTH2'
export const oauth2Provider = {
  provide: OAUTH2,
  useFactory: () => {
    const tokenExpiry  = (process.env.OAUTH_TOKEN_EXPIRY) ? parseInt(process.env.OAUTH_TOKEN_EXPIRY) : 60*60*23;

    return  new OAuth2Server({
      model: (new OAuth2ModelService()).toObject(),
      accessTokenLifetime: tokenExpiry,
      refreshTokenLifetime: tokenExpiry * 2,
      allowBearerTokensInQueryString: true
    });

  }
}
