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

export type LoginCallback<T extends Record<string, any>> = (input:HandleInput, token: User<T>, user: T) => MaybePromise<any>

export interface User<T extends Record<string, any>>{
    provider: string;
    providerId: string;
    expiresIn: number;
    providerUserData?: T;
}

export interface AuthOption{
    key: string;
    maxAge: number;
    autoRefreshMaxAge: boolean;
}