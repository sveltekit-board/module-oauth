# provider

인증 제공자를 사용하기 위해 사용합니다.

사용법은 다음과 같습니다. 예를 들어 깃헙을 이용하려면

```js
import auth, {provider} from '@sveltekit-board/auth';

const github = new provider.Github({
    clientId: process.env.GITHUB_CLIENT_ID,//clientId
    clientSecret: process.env.GITHUB_CLIENT_SECRET//clientSecret
});

export const handle = auth([github], ...);
```

와 같이 사용합니다.

## Provider 클래스 생성자

```ts
class Provider<T>{
    ...
    constructor(client:Client){
        this.client = client;
    }
    ...
}

interface Client {
    clientId: string;
    clientSecret: string;
}
```

## 새로운 제공자 만들기

OAuth 인증 과정을 단순화하면 다음과 같습니다.

1. `loginUrlPath`로 요청하면 `oAuthUrl`로 리다이렉트 됩니다.
2. `oAuthUrl`에서 각 제공자에 로그인 하면 `callbackUriPath`로 리다이렉트 됩니다.
3. 서버에서 `accessTokenUrl`로 요청하여 `access_token`을 가져옵니다.
4. 서버에서 `userdataRequestUrl`로 요청하여 각 제공자에서 유저 데이터를 가져옵니다.

새로운 제공제 클래스를 만드려면 `loginUrlPath`, `oAuthUrl`, `callbackUriPath`, `accessTokenUrl`, `userdataRequestUrl`와 `createUser`, `getAccessToken` 메소드를 설정해야합니다. 깃헙을 예로 들면 다음과 같습니다.

```ts
class Github extends Provider<GithubUserData> {
    loginUrlPath: string = "/auth/login/github";
    callbackUriPath: string = "/auth/callback/github";
    oAuthUrl: string = "https://github.com/login/oauth/authorize";
    accessTokenUrl: string = "https://github.com/login/oauth/access_token";
    userdataRequestUrl: string = "https://api.github.com/user";

    createUser(userResponse: GithubUserData): UserWithouExpiresIn<T> {//userdataRequestUrl 로 요청하여 받은 데이터를 처리하여 expiresIn 프로퍼티가 없는 User 형식(UserWithouExpiresIn)으로 반환해야합니다.
        return {
            provider: "github",
            providerId: userResponse.id.toString(),
            providerUserData: userResponse
        }
    }

    getAccessToken(response: any): string {//accessTokenUrl로 요청하여 받은 데이터를 처리하여 access_token을 반환해야합니다.
        const responseParams = new URLSearchParams(response);
        return responseParams.get('access_token') as string;
    }
}

export interface UserWithouExpiresIn<T extends Record<string, any>>{
    provider: string;
    providerId: string;
    providerUserData?: T;
}
```