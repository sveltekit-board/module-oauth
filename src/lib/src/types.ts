import type { MaybePromise, RequestEvent, ResolveOptions } from "@sveltejs/kit";

export interface Provider extends Client {
    loginUriPath: string;
    callbackUriPath: string;
    loginCallback?: LoginCallback<any>
    handle: (option: AuthOption) => Handle;
}

export type Handle = (input: HandleInput) => MaybePromise<Response>

export type HandleInput = {
    event: RequestEvent;
    resolve(event: RequestEvent, opts?: ResolveOptions): MaybePromise<Response>
}

export interface Client {
    clientId: string;
    clientSecret: string;
}

export type LoginCallback<T> = (input:HandleInput, token: User, user: T) => MaybePromise<any>

export interface User{
    provider: string;
    providerId: string;
    token?:Token;
    providerUserData?: Record<string, any>;
}

export interface Token{
    access_token: string;
    token_type?: string;
    refresh_token?: string;
    expires_in?: number;
    expiration?: number;
    scope?: string;
    refresh_token_expires_in?: number;
    refresh_token_expiration?: number;
}

export interface AuthOption{
    key: string;
    maxAge: number;
    autoRefreshMaxAge: boolean;
}