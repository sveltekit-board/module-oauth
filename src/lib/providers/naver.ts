import type { AuthOption, Client, Handle, HandleInput, LoginCallback, Provider, User } from "$lib/src/types.js";
import { cipher } from "$lib/src/crypto.js";
import { redirect } from "@sveltejs/kit";
import axios, { type AxiosResponse } from "axios";
import { randomBytes } from "crypto";

export default class Naver implements Provider {
    clientId: string;
    clientSecret: string;
    loginUriPath: string = "/auth/login/naver";
    callbackUriPath: string = "/auth/callback/naver";
    loginCallback?: LoginCallback<NaverUserData>;

    constructor(client: Client, loginCallback?: LoginCallback<NaverUserData>) {
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
                    input.event.cookies.delete("auth-state", { path: '/' });
                    const state = randomBytes(32).toString('hex');
                    input.event.cookies.set("auth-state", state, { path: '/' });

                    const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
                    naverAuthUrl.searchParams.append("client_id", clientId);
                    naverAuthUrl.searchParams.append("redirect_uri", "http://localhost:5173/auth/callback/naver");
                    naverAuthUrl.searchParams.append("response_type", "code");
                    naverAuthUrl.searchParams.append("state", state);

                    input.event.cookies.delete('auth-redirect-to', { path: '/' });
                    const redirectTo = input.event.url.searchParams.get('redirect_to');
                    if (redirectTo !== null) {
                        input.event.cookies.set('auth-redirect-to', redirectTo, { path: '/' });
                    }

                    throw redirect(302, naverAuthUrl.href);
                }
                case (callbackUriPath): {
                    const cookieState = input.event.cookies.get("auth-state");
                    const uriState = input.event.url.searchParams.get("state");
                    if (cookieState === undefined || uriState === null || cookieState !== uriState) {
                        throw new Error("Invalid state");
                    }
                    input.event.cookies.delete("auth-state", { path: '/' });

                    const code = input.event.url.searchParams.get('code') as string;

                    const redirectUri = new URL(input.event.url.origin)
                    redirectUri.pathname = callbackUriPath

                    const response: AxiosResponse = await axios({
                        method: 'GET',
                        url: 'https://nid.naver.com/oauth2.0/token',
                        params: {
                            'grant_type': "authorization_code",
                            'client_id': clientId,
                            'client_secret': clientSecret,
                            'code': code,
                            'state': uriState
                        }
                    });

                    console.log(response.data)

                    const currentTime = new Date().getTime();

                    const userResponse: NaverUserResponse = (await axios({
                        method: 'GET',
                        url: 'https://openapi.naver.com/v1/nid/me',
                        headers: {
                            'Authorization': `Bearer ${response.data['access_token']}`
                        }
                    })).data;

                    const user: User = {
                        provider: "naver",
                        providerId: userResponse.response.id,
                        token: {
                            ...response.data,
                            expires_in: Number(response.data.expires_in),
                            expiration: currentTime + Number(response.data.expires_in) * 1000
                        },
                        providerUserData: userResponse.response
                    }

                    if (loginCallback !== undefined) {
                        await loginCallback(input, user, userResponse.response)
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