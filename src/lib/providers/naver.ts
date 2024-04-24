import Provider from "$lib/src/provider.js";
import type { User } from "$lib/src/types.js";

export default class Naver extends Provider<NaverUserData> {
    loginUrlPath: string = "/auth/login/naver";
    callbackUriPath: string = "/auth/callback/naver";
    oAuthUrl: string = "https://nid.naver.com/oauth2.0/authorize";
    accessTokenUrl: string = "https://nid.naver.com/oauth2.0/token";
    userdataRequestUrl: string = "https://openapi.naver.com/v1/nid/me";

    createUser(userdataResponse: NaverUserResponse): User<NaverUserData> {
        return {
            provider: "naver",
            providerId: userdataResponse.response.id,
            providerUserData: userdataResponse.response
        }
    }

    getAccessToken(response: any): string {
        const responseParams = new URLSearchParams(response);
        return responseParams.get('access_token') as string;
    }
}

interface NaverUserResponse {
    resultcode: string;
    message: string;
    response: NaverUserData
}

export interface NaverUserData {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    gender?: string;
    age?: string;
    birthday?: string;
    profile_image?: string;
    birthyear?: string;
    mobile?: string;
}