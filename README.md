# @sveltekit-board/auth

이 라이브러리는 인증기능을 담당합니다. 현재 OAuth 인증을 지원합니다. 

**Note**
이 라이브러리는 사용자를 **구별**하는 것이 목적입니다. 그 과정에서 `access_token` 등의 토큰을 받아오기는 하나, 이 토큰은 유저 데이터를 받아올 때만 사용합니다. 따라서 해당 토큰이 필요한 경우에는 별도 라이브러리를 사용해야합니다.

## 사용법

### 설치
`npm i @sveltekit-board/auth`

### 사용
```js
/* src/hooks.server.ts */
import { sequence } from '@sveltejs/kit/hooks';
import auth, { providers } from '@sveltekit-board/auth';

const github = new providers.Github({
    clientId: process.env.GITHUB_CLIENT_ID,//client id
    clientSecret: process.env.GITHUB_CLIENT_SECRET//client secret
})
const kakao = new providers.Kakao({
    clientId: process.env.KAKAO_CLIENT_ID,//client id
    clientSecret: process.env.KAKAO_CLIENT_SECRET//client secret
})

export const handle = sequence(auth([github, kakao], {
    key: process.env.AUTH_KEY, 
    maxAge: 3600, 
    autoRefreshMaxAge: true
}), async function({event, resolve}){
    //hook에 사용할 함수
    return await resolve(event)
})
```

### 살펴보기
- [auth()](https://github.com/sveltekit-board/module-auth/tree/main/docs/auth.md)
- [provider](https://github.com/sveltekit-board/module-auth/tree/main/docs/provider.md)