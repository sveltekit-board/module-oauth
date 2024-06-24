import type { AuthOption, HandleInput, LoginCallback, User, UserWithouExpiresIn } from "./types.js";
import type { Client } from "./types.js";
import { randomBytes } from "crypto";
import { redirect } from "@sveltejs/kit";
import axios, { type AxiosResponse } from 'axios';
import { cipher } from "./crypto.js";
import { createCookieOption } from "./auth.js";

export default class Provider<T extends Record<string, any>>{
    client:Client;

    // @ts-expect-error
    loginUrlPath: string; callbackUriPath: string; oAuthUrl: string; accessTokenUrl: string; userdataRequestUrl: string;
    // @ts-expect-error
    createUser(userdataResponse: any): UserWithouExpiresIn<T>;
    // @ts-expect-error
    getAccessToken(responseData: any): string;
    

    // @ts-check
    constructor(client:Client){
        this.client = client;
    }

    handle(option: AuthOption){
        const P = this;

        return async (input: HandleInput) => {
            switch(input.event.url.pathname){
                case(P.loginUrlPath): {
                    //remove state
                    input.event.cookies.delete("auth-state", { path:'/' });

                    //create and implement state
                    const state = randomBytes(32).toString('hex');
                    input.event.cookies.set("auth-state", state, {path:'/'});

                    //url
                    const authUrl = new URL(P.oAuthUrl);
                    const redirectUri = new URL(input.event.url.origin);
                    redirectUri.pathname = P.callbackUriPath;
                    authUrl.searchParams.append("client_id", P.client.clientId);
                    authUrl.searchParams.append("redirect_uri", redirectUri.href);
                    authUrl.searchParams.append("response_type", "code");
                    authUrl.searchParams.append("state", state);

                    //check redirect-to
                    input.event.cookies.delete('auth-redirect-to', { path: '/' });
                    const redirectTo = input.event.url.searchParams.get('redirect_to');
                    if(redirectTo !== null){
                        input.event.cookies.set('auth-redirect-to', redirectTo, { path: '/' });
                    }

                    throw redirect(302, authUrl.href);
                }
                case(P.callbackUriPath): {
                    //state check
                    const cookieState = input.event.cookies.get("auth-state");
                    const uriState = input.event.url.searchParams.get("state")
                    if(cookieState === undefined || uriState === null || cookieState !== uriState){
                        throw new Error("Invalid state");
                    }
                    input.event.cookies.delete("auth-state", { path:'/' })

                    //code query
                    const code = input.event.url.searchParams.get('code') as string;

                    //to redirectUri
                    const redirectUri = new URL(input.event.url.origin)
                    redirectUri.pathname = P.callbackUriPath

                    //request
                    const response:AxiosResponse = await axios({
                        method: 'POST',
                        url: P.accessTokenUrl,
                        data: {
                            'client_id': P.client.clientId,
                            'client_secret': P.client.clientSecret,
                            'code': code,
                            'redirect_uri': redirectUri.href,
                            'grant_type': "authorization_code",
                            'state': uriState
                        },
                        headers: {
                            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    });

                    const accessToken = P.getAccessToken(response.data);

                    //request user data
                    const userdataResponse:T = (await axios({
                        method: 'GET',
                        url: P.userdataRequestUrl,
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8"
                        }
                    })).data

                    let user: Partial<User<T>> = P.createUser(userdataResponse);
                    user.expiresIn = Date.now() + option.maxAge * 1000;
                    const token = cipher(JSON.stringify(user), option.key);
                    input.event.cookies.set('auth-user', token, createCookieOption(option.maxAge, option?.withCredentials ?? false));

                    const redirectTo = input.event.cookies.get("auth-redirect-to");
                    if(redirectTo !== undefined){
                        input.event.cookies.delete("auth-redirect-to", { path:"/" });
                        throw redirect(302, redirectTo);
                    }
                    else{
                        throw redirect(302, '/');
                    }
                }
            }
            return await input.resolve(input.event);
        }
    }
}