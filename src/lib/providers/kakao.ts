import Provider from "$lib/src/provider.js";

export default class Kakao extends Provider<KakaoUserData> {
    loginUrlPath: string = "/auth/login/kakao";
    callbackUriPath: string = "/auth/callback/kakao";
    oAuthUrl: string = 'https://kauth.kakao.com/oauth/authorize';
    accessTokenUrl: string = 'https://kauth.kakao.com/oauth/token';
    userdataRequestUrl: string = 'https://kapi.kakao.com/v2/user/me';

    createUser(userdataResponse: KakaoUserData) {
        return {
            provider: "kakao",
            providerId: userdataResponse.id.toString(),
            providerUserData: userdataResponse
        }
    }

    getAccessToken(responseData: any) {
        return responseData['access_token'];
    }
}

export interface KakaoUserData {
    id: number,
    connected_at: string,
    properties: Record<string, any>,
    kakao_account: {
        profile_needs_agreement?: boolean,
        profile_nickname_needs_agreement?: boolean,
        profile_image_needs_agreement?: boolean,
        name_needs_agreement?: boolean,
        name?: string,
        email_needs_agreement?: boolean,
        is_email_valid?: boolean,
        is_email_verified?: boolean,
        email: string,
        age_range_needs_agreement?: boolean,
        age_range?: string,
        birthyear_needs_agreement?: boolean,
        birthyear?: string,
        birthday_needs_agreement?: boolean,
        birthday?: string,
        birthday_type?: string,
        gender_needs_agreement?: boolean,
        gender?: string,
        phone_number_needs_agreement?: boolean,
        phone_number?: string,
        ci_needs_agreement?: boolean,
        ci?: string,
        ci_authenticated_at?: string,
        profile: {
            nickname?: string,
            thumbnail_image_url?: string,
            profile_image_url?: string,
            is_default_image?: boolean,
            is_default_nickname?: boolean
        }
    }
}