import { cipher } from "$lib/src/crypto.js";
import type { AuthOption, Client, HandleInput, LoginCallback, Provider, User } from "$lib/src/types.js";
import { redirect } from "@sveltejs/kit";
import axios, { type AxiosResponse } from "axios";
import { randomBytes } from "crypto";

export default class Github implements Provider {
    clientId: string;
    clientSecret: string;
    loginUriPath: string = "/auth/login/github";
    callbackUriPath: string = "/auth/callback/github";
    loginCallback?: LoginCallback<GithubUserData>;

    constructor(client: Client, loginCallback?:LoginCallback<GithubUserData>) {
        this.clientId = client.clientId;
        this.clientSecret = client.clientSecret;
        if(loginCallback !== undefined){
            this.loginCallback = loginCallback
        }
    }

    handle(option:AuthOption) {
        const loginUriPath = this.loginUriPath;
        const clientId = this.clientId;
        const callbackUriPath = this.callbackUriPath;
        const clientSecret = this.clientSecret;
        const loginCallback = this.loginCallback

        return async function(input: HandleInput){
            switch (input.event.url.pathname) {
                case (loginUriPath): {
                    input.event.cookies.delete("auth-state", { path:'/' });
                    const state = randomBytes(32).toString('hex');
                    input.event.cookies.set("auth-state", state, {path:'/'});

                    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
                    githubAuthUrl.searchParams.append("client_id", clientId);
                    githubAuthUrl.searchParams.append("redirect_uri", "http://localhost:5173/auth/callback/github");
                    githubAuthUrl.searchParams.append("state", state);

                    input.event.cookies.delete('auth-redirect-to', { path: '/' });
                    const redirectTo = input.event.url.searchParams.get('redirect_to');
                    if(redirectTo !== null){
                        input.event.cookies.set('auth-redirect-to', redirectTo, { path: '/' });
                    }

                    throw redirect(302, githubAuthUrl.href);
                }
                case (callbackUriPath): {
                    const cookieState = input.event.cookies.get("auth-state");
                    const uriState = input.event.url.searchParams.get("state")
                    if(cookieState === undefined || uriState === null || cookieState !== uriState){
                        throw new Error("Invalid state");
                    }
                    input.event.cookies.delete("auth-state", { path:'/' })

                    const code = input.event.url.searchParams.get('code') as string;
    
                    const redirectUri = new URL(input.event.url.href)
                    redirectUri.pathname = callbackUriPath
    
                    const response:AxiosResponse = await axios({
                        method: 'POST',
                        url: 'https://github.com/login/oauth/access_token',
                        data: {
                            'client_id': clientId,
                            'client_secret': clientSecret,
                            'code': code,
                            'redirect_uri': redirectUri.href
                        }
                    });
    
                    const responseParams = new URLSearchParams(response.data)
    
                    const userResponse:GithubUserData = (await axios({
                        method: 'GET',
                        url: 'https://api.github.com/user',
                        headers: {
                            'Authorization': `Bearer ${responseParams.get('access_token')}`
                        }
                    })).data;

                    const user:User = {
                        provider: "github",
                        providerId: userResponse.id.toString(),
                        token: {
                            access_token: responseParams.get('access_token') as string
                        },
                        providerUserData: userResponse
                    }

                    if(loginCallback !== undefined){
                        await loginCallback(input, user, userResponse)
                    }

                    const token = cipher(JSON.stringify(user), option.key);
                    input.event.cookies.set('auth-user', token, {path:'/', maxAge: option.maxAge})

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
            return await input.resolve(input.event)
        }
    }
}

export interface GithubUserData{
    login: string,
    id: number,
    node_id: string,
    avatar_url: string,
    gravatar_id: '',
    url: string,
    html_url: string,
    followers_url: string,
    following_url: string,
    gists_url: string,
    starred_url: string,
    subscriptions_url: string,
    organizations_url: string,
    repos_url: string,
    events_url: string,
    received_events_url: string,
    type: string,
    site_admin: boolean,
    name: string|null,
    company: string|null,
    blog: string|null,
    location: string|null,
    email: string|null,
    hireable: string|null,
    bio: string|null,
    twitter_username: string|null,
    public_repos: number,
    public_gists: number,
    followers: number,
    following: number,
    created_at: string,
    updated_at: string
  }