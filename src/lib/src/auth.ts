import { sequence } from "@sveltejs/kit/hooks";
import type { AuthOption, HandleInput, User } from "./types.js";
import Provider from "./provider.js";
import { cipher, decipher } from "./crypto.js";

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

        //만료 확인
        if (user.expiresIn < Date.now()) {
            input.event.cookies.delete("auth-user", { path: '/' });
            return await input.resolve(input.event);
        }

        input.event.locals.user = user;

        if (option.autoRefreshMaxAge) {
            user.expiresIn = Date.now() + option.maxAge * 1000;
            const newToken = cipher(JSON.stringify(user), option.key);
            input.event.cookies.set('auth-user', newToken, createCookieOption(option.maxAge, option?.withCredentials ?? false));
        };
        
        return await input.resolve(input.event);
    }
}

export function createCookieOption(maxAge: number, withCredentials: boolean) {
    const defaultOption = {
        path: '/',
        maxAge
    }
    if (withCredentials) {
        const sameSite: 'none' = 'none';
        return {
            httpOnly: true,
            secure: true,
            sameSite,
            ...defaultOption
        }
    }
    else {
        return defaultOption
    }
}

export default function auth(providers: Provider<any>[], option: AuthOption) {
    return sequence(getUser(option), ...providers.map(provider => provider.handle(option)))
}