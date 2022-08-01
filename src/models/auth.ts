export interface IOauthSanitizedUser {
    id?: string|number;
    uuid?: string;
    username?: string|number;
    email?: string;
    sessId?: string;
    firstName?: string;
    lastName?: string;
    defaultDb?: string;
}

export interface IOauthToken {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    refreshTokenExpiresAt?: Date;
    scope: string;
    user?: IOauthSanitizedUser;
    client?: { id: string };
    sessId?: string;
    cookie?: string;
}
