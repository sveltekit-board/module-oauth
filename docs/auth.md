# auth()

`auth` 함수는 다음과 같이 사용합니다.

```typescript
auth(providers: Provider<any>[], option: AuthOption)

interface AuthOption{
    key: string;//암호화에 사용할 key값입니다. 256 비트(32 바이트)의 16진수가 필요합니다.
    maxAge: number;//로그인 유지 시간입니다(초단위).
    absoluteMaxAge?: number;//절대 유지 시간입니다(초단위). 해당 시간이 지나면 무조건 값이 만료됩니다.
    autoRefreshMaxAge: boolean;//로그인 유지 시간 내에 요청을 받을 시 유지 시간을 업데이트 할 지 여부입니다.
    withCredentials: boolean;//타 origin에서 요청 시 쿠키를 공유할 지 여부입니다. true시 httpOnly: true, secure: true, sameSite: 'none'로 설정됩니다. https를 사용하지 않는 사이트에서는 사용 불가능합니다. 기본값은 false 입니다.
}
```

`hooks.server.js`에 `handle`이라는 이름으로 export 해도 되지만, 추가적인 `handle` 함수를 사용하시려면 `sequence`를 사용하세요.

```js
import { sequence } from '@sveltejs/kit/hooks';

...

async function myHandle({event, resolve}){
    ...
    //핸들 함수
    return await resolve(event);
}

export const handle = sequence(auth(...), myHandle)
```

## 유저 정보 사용하기

제대로 작동이 되었다면 `event.locals.user`에 사용자 정보가 저장됩니다. 형식은 다음과 같습니다.
```typescript
interface User<T>{
    provider: string;//인증 제공자를 나타냅니다.
    providerId: string;//인증 제공자에서 사용자를 구분하기 위한 id입니다.
    expiresIn: number;//만료시간입니다. 유닉스 시간(ms단위)을 사용합니다.
    absoluteExpireIn?: number;//절대 만료 시간입니다(ms단위).
    providerUserData?: T;//인증 제공자에서 제공하는 사용자 정보입니다. 제공자마다 다릅니다.
}
```
사용자를 구분하기 위해서는 `provider, providerId` 쌍을 사용합니다. 이 쌍은 사용자마다 고유합니다.

만약 `expiresIn`의 값이 현재 시간보다 작다면 쿠키가 삭제됩니다.