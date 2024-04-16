import { sequence } from "@sveltejs/kit/hooks";
import type { AuthOption, HandleInput, Provider } from "./types.js";
import { decipher } from "./crypto.js";

function getUser(option: AuthOption) {
    return async function (input: HandleInput) {
        const token = input.event.cookies.get("auth-user");
        if (!token) {
            return await input.resolve(input.event)
        }

        const user = JSON.parse(decipher(token, option.key));
        input.event.locals.user = user;

        if(option.autoRefreshMaxAge){
            input.event.cookies.set('auth-user', token, { path: '/', maxAge: option.maxAge })
        };

        return await input.resolve(input.event);
    }
}

export default function auth(providers: Provider[], option: AuthOption) {
    return sequence(getUser(option), ...providers.map(provider => provider.handle(option)))
}