import type { AuthOption, HandleInput, LoginCallback, User, UserWithouExpiresIn } from "./types.js";
import type { Client } from "./types.js";
import { randomBytes } from "crypto";
import { redirect, type Handle } from "@sveltejs/kit";
import axios, { type AxiosResponse } from 'axios';
import { cipher } from "./crypto.js";
import { createCookieOption } from "./auth.js";

export default abstract class Provider<T extends Record<string, any>> {
    client: Client;

    abstract loginUrlPath: string;
    abstract callbackUriPath: string;
    abstract oAuthUrl: string;
    abstract accessTokenUrl: string;
    abstract userdataRequestUrl: string;
    abstract createUser(userdataResponse: any): UserWithouExpiresIn<T>;
    abstract getAccessToken(responseData: any): string;

    /**
     * get auth url(login page)
     * @param input 
     * @param state 
     * @returns
     */
    getAuthUrl(input: HandleInput, state: string) {
        const authUrl = new URL(this.oAuthUrl);
        const redirectUri = new URL(input.event.url.origin);
        redirectUri.pathname = this.callbackUriPath;
        authUrl.searchParams.append("client_id", this.client.clientId);
        authUrl.searchParams.append("redirect_uri", redirectUri.href);
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append("state", state);

        return authUrl;
    }


    // @ts-check
    constructor(client: Client) {
        this.client = client;
    }

    handle(option: AuthOption) {
        const THIS = this;
        return async (input: HandleInput) => {
            switch (input.event.url.pathname) {
                case (THIS.loginUrlPath): {
                    await this.handleLoginUrl(input);
                    break;
                }
                case (THIS.callbackUriPath): {
                    await this.handleCallbackUri(option, input);
                    break;
                }
            }
            return await input.resolve(input.event);
        }
    }

    /**
     * 로그인 URL 처리
     */
    private async handleLoginUrl(input: HandleInput) {
        const state = this.resetState(input);
        const authUrl = this.getAuthUrl(input, state);
        this.resetRedirectTo(input);

        throw redirect(302, authUrl.href);
    }

    /**
     * OAuth state를 재설정
     */
    private resetState(input: HandleInput) {
        input.event.cookies.delete("auth-state", { path: '/' });

        const state = randomBytes(32).toString('hex');
        input.event.cookies.set("auth-state", state, { path: '/' });

        return state;
    }

    /**
     * OAuth 로그인 후 리다이렉트 URL을 재설정
     */
    private resetRedirectTo(input: HandleInput) {
        input.event.cookies.delete('auth-redirect-to', { path: '/' });
        const redirectTo = input.event.url.searchParams.get('redirect_to');
        if (redirectTo !== null) {
            input.event.cookies.set('auth-redirect-to', redirectTo, { path: '/' });
        }
    }

    /**
     * Callback URI 처리
     */
    private async handleCallbackUri(option: AuthOption, input: HandleInput) {
        const uriState = this.checkState(input);
        const code = input.event.url.searchParams.get('code') as string;
        const redirectUri = this.getRedirectUri(input);
        const accessToken = await this.requestAccessToken(code, redirectUri, uriState);
        const userData = await this.requestUserData(accessToken);
        const token = this.createToken(option, userData);
        this.setToken(token, option, input);
        this.finishLogin(input);
    }

    /**
     * OAuth state를 체크하고 쿠키에서 삭제
     */
    private checkState(input: HandleInput) {
        const cookieState = input.event.cookies.get("auth-state");
        const uriState = input.event.url.searchParams.get("state")
        if (cookieState === undefined || uriState === null || cookieState !== uriState) {
            throw new Error("Invalid state");
        }
        input.event.cookies.delete("auth-state", { path: '/' });
        return uriState;
    }
    /**
     * redirect_uri 가져오기
     */
    private getRedirectUri(input: HandleInput) {
        const redirectUri = new URL(input.event.url.origin);
        redirectUri.pathname = this.callbackUriPath;
        return redirectUri;
    }
    /**
     * access token 요청
     */
    private async requestAccessToken(code: string, redirectUri: URL, uriState: string) {
        const response: AxiosResponse = await axios({
            method: 'POST',
            url: this.accessTokenUrl,
            data: {
                'client_id': this.client.clientId,
                'client_secret': this.client.clientSecret,
                'code': code,
                'redirect_uri': redirectUri.href,
                'grant_type': "authorization_code",
                'state': uriState
            },
            headers: {
                'Content-Type': "application/x-www-form-urlencoded;charset=utf-8"
            }
        });

        return this.getAccessToken(response.data);
    }

    /**
     * 유저 데이터 요청
     */
    private async requestUserData(accessToken: string): Promise<T> {
        return await axios({
            method: 'GET',
            url: this.userdataRequestUrl,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': "application/x-www-form-urlencoded;charset=utf-8"
            }
        }).then((response) => response.data)
    }

    /**
     * 토큰 생성
     */
    private createToken(option: AuthOption, userData: any) {
        const user: User<T> = {
            ...this.createUser(userData),
            expiresIn: Date.now() + option.maxAge * 1000,
            uniqueKey: randomBytes(32).toString('hex')
        };
        if (option.absoluteMaxAge) {
            user.absoluteExpiresIn = Date.now() + option.absoluteMaxAge * 1000;
        }
        return cipher(JSON.stringify(user), option.key);
    }

    /**
     * 토큰 설정
     */
    private setToken(token: string, option: AuthOption, input: HandleInput) {
        if (option.useSubdomain) {
            input.event.cookies.set('auth-user', token, createCookieOption(option.maxAge, option?.withCredentials ?? false, input.event.url.hostname));
        }
        else {
            input.event.cookies.set('auth-user', token, createCookieOption(option.maxAge, option?.withCredentials ?? false));
        }
    }

    /**
     * 작업 완료 후 리다이렉트
     */
    private finishLogin(input: HandleInput) {
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