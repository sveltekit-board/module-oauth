import type { AuthOption, Client, Handle, HandleInput, LoginCallback, Provider, User } from "$lib/src/types.js";
import { cipher } from "$lib/src/crypto.js";
import { redirect } from "@sveltejs/kit";
import axios, { type AxiosResponse } from "axios";

export default class Kakao implements Provider {
    clientId: string;
    clientSecret: string;
    loginUriPath: string = "/auth/login/kakao";
    callbackUriPath: string = "/auth/callback/kakao";
    loginCallback?: LoginCallback<KakaoUserData>;

    constructor(client: Client, loginCallback?: LoginCallback<KakaoUserData>) {
        this.clientId = client.clientId;
        this.clientSecret = client.clientSecret;
        if (loginCallback !== undefined) {
            this.loginCallback = loginCallback
        }
    }

    handle(option: AuthOption) {
        const loginUriPath = this.loginUriPath;
        const clientId = this.clientId;
        const callbackUriPath = this.callbackUriPath;
        const clientSecret = this.clientSecret;
        const loginCallback = this.loginCallback

        return async function (input: HandleInput) {
            switch (input.event.url.pathname) {
                case (loginUriPath): {
                    const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
                    kakaoAuthUrl.searchParams.append("client_id", clientId);
                    kakaoAuthUrl.searchParams.append("redirect_uri", "http://localhost:5173/auth/callback/kakao");
                    kakaoAuthUrl.searchParams.append("response_type", "code")

                    const redirectTo = input.event.url.searchParams.get('redirect_to');
                    if (redirectTo !== null) {
                        input.event.cookies.set('auth-redirect-to', redirectTo, { path: '/' });
                    }

                    throw redirect(302, kakaoAuthUrl.href);
                }
                case (callbackUriPath): {
                    const code = input.event.url.searchParams.get('code') as string;

                    const redirectUri = new URL(input.event.url.origin)
                    redirectUri.pathname = callbackUriPath

                    const response: AxiosResponse = await axios({
                        method: 'POST',
                        url: '	https://kauth.kakao.com/oauth/token',
                        data: {
                            'client_id': clientId,
                            'client_secret': clientSecret,
                            'code': code,
                            'redirect_uri': redirectUri.href,
                            'grant_type': "authorization_code"
                        },
                        headers: {
                            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    });

                    const currentTime = new Date().getTime()

                    const userResponse: KakaoUserData = (await axios({
                        method: 'GET',
                        url: 'https://kapi.kakao.com/v2/user/me',
                        headers: {
                            'Authorization': `Bearer ${response.data['access_token']}`,
                            'Content-Type': "Content-type: application/x-www-form-urlencoded;charset=utf-8"
                        }
                    })).data;

                    const user: User = {
                        provider: "kakao",
                        providerId: userResponse.id.toString(),
                        token: {
                            ...response.data,
                            expiration: currentTime + response.data.expires_in * 1000,
                            refresh_token_expiration: currentTime + response.data.refresh_token_expires_in * 1000
                        },
                        providerUserData: userResponse
                    }

                    if (loginCallback !== undefined) {
                        await loginCallback(input, user, userResponse)
                    }

                    const token = cipher(JSON.stringify(user), option.key);
                    input.event.cookies.set('auth-user', token, { path: '/', maxAge: option.maxAge })

                    const redirectTo = input.event.cookies.get("auth-redirect-to");
                    if (redirectTo !== undefined) {
                        input.event.cookies.delete("auth-redirect-to", { path: "/" });
                        throw redirect(302, redirectTo);
                    }
                    else {
                        throw redirect(302, '/');
                    }
                }
            }
            return await input.resolve(input.event)
        }
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