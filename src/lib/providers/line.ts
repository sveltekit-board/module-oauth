import Provider from "$lib/src/provider.js";
import type { Client, HandleInput, User, UserWithouExpiresIn } from "$lib/src/types.js";

export default class Line extends Provider<LineUserData> {
    loginUrlPath: string = "/auth/login/line";
    callbackUriPath: string = "/auth/callback/line";
    oAuthUrl: string = "https://access.line.me/oauth2/v2.1/authorize";
    accessTokenUrl: string = "https://api.line.me/oauth2/v2.1/token";
    userdataRequestUrl: string = "https://api.line.me/v2/profile";
    scope: string[];

    constructor(client: Client, scope:string[]) {
        super(client);
        this.scope = scope;
    }

    createUser(userdataResponse: LineUserResponse): UserWithouExpiresIn<LineUserData> {
        return {
            provider: "line",
            providerId: userdataResponse.userId,
            providerUserData: userdataResponse
        }
    }

    getAccessToken(response: any): string {
        const responseParams = new URLSearchParams(response);
        return responseParams.get('access_token') as string;
    }

    getAuthUrl(input: HandleInput, state: string): URL {
        const authUrl = super.getAuthUrl(input, state);
        authUrl.searchParams.append("scope", this.scope.join(' '))

        return authUrl;
    }
}

interface LineUserResponse {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

export interface LineUserData {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}