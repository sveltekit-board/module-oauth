import { sequence } from '@sveltejs/kit/hooks';
import { config } from 'dotenv';
import auth from '$lib/src/auth.js';
import Github from '$lib/providers/github.js';
import Kakao from '$lib/providers/kakao.js';
import Naver from '$lib/providers/naver.js';
import Line from '$lib/providers/line.js';

config();

const github = new Github({
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string
})
const kakao = new Kakao({
    clientId: process.env.KAKAO_CLIENT_ID as string,
    clientSecret: process.env.KAKAO_CLIENT_SECRET as string
})
const naver = new Naver({
    clientId: process.env.NAVER_CLIENT_ID as string,
    clientSecret: process.env.NAVER_CLIENT_SECRET as string
})
const line = new Line({
    clientId: process.env.LINE_CLIENT_ID as string,
    clientSecret: process.env.LINE_CLIENT_SECRET as string
}, ['profile'])


export const handle = sequence(auth([github, kakao, naver, line], {
    key: process.env.AUTH_KEY as string,
    maxAge: 3600,
    autoRefreshMaxAge: true,
    withCredentials: true,
    useSubdomain: true
}), async function ({ event, resolve }) {
    if (event.locals.user) {
        console.log(event.locals.user)
    }
    return await resolve(event)
})