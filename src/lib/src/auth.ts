import { sequence } from "@sveltejs/kit/hooks";
import type { AuthOption, HandleInput, User } from "./types.js";
import Provider from "./provider.js";
import { cipher, decipher } from "./crypto.js";
import type { CookieSerializeOptions } from 'cookie';

function getUser(option: AuthOption) {
    return async function (input: HandleInput) {
        const token = input.event.cookies.get("auth-user");
        if (!token) {
            return await input.resolve(input.event)
        }

        let user: User<any>
        try {
            user = JSON.parse(decipher(token, option.key));
        }
        catch {
            //key 값이 올바르지 않아서 복호화가 안된다면 종료
            input.event.cookies.delete("auth-user", { path: '/' });
            return await input.resolve(input.event);
        }

        //절대 만료 확인
        if (user.absoluteExpiresIn && user.absoluteExpiresIn < Date.now()) {
            input.event.cookies.delete("auth-user", { path: '/' });
            return await input.resolve(input.event);
        }

        //만료 확인
        if (user.expiresIn < Date.now()) {
            input.event.cookies.delete("auth-user", { path: '/' });
            return await input.resolve(input.event);
        }

        input.event.locals.user = user;

        if (option.autoRefreshMaxAge) {
            user.expiresIn = Date.now() + option.maxAge * 1000;
            const newToken = cipher(JSON.stringify(user), option.key);
            if(option.useSubdomain){
                input.event.cookies.set('auth-user', newToken, createCookieOption(option.maxAge, option?.withCredentials ?? false, input.event.url.hostname));
            }
            else{
                input.event.cookies.set('auth-user', newToken, createCookieOption(option.maxAge, option?.withCredentials ?? false));
            }
        };

        return await input.resolve(input.event);
    }
}

export function createCookieOption(maxAge: number, withCredentials: boolean, domain?: string) {
    let defaultOption: CookieSerializeOptions = {
        path: '/',
        maxAge
    }
    if (withCredentials) {
        const sameSite: 'none' = 'none';
        defaultOption = {
            httpOnly: true,
            secure: true,
            sameSite,
            ...defaultOption
        }
    }
    if (domain) {
        defaultOption = {
            domain: `.${domain}`,
            ...defaultOption
        }
    }
    console.log(defaultOption);
    return defaultOption as CookieSerializeOptions & { path: string }
}

export default function auth(providers: Provider<any>[], option: AuthOption) {
    return sequence(getUser(option), ...providers.map(provider => provider.handle(option)))
}