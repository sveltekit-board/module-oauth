import Provider from "$lib/src/provider.js";

export default class Github extends Provider<GithubUserData> {
    loginUrlPath: string = "/auth/login/github";
    callbackUriPath: string = "/auth/callback/github";
    oAuthUrl: string = "https://github.com/login/oauth/authorize";
    accessTokenUrl: string = "https://github.com/login/oauth/access_token";
    userdataRequestUrl: string = "https://api.github.com/user";

    createUser(userResponse: GithubUserData) {
        return {
            provider: "github",
            providerId: userResponse.id.toString(),
            providerUserData: userResponse
        }
    }

    getAccessToken(response: any): string {
        const responseParams = new URLSearchParams(response);
        return responseParams.get('access_token') as string;
    }
}

export interface GithubUserData {
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
    name: string | null,
    company: string | null,
    blog: string | null,
    location: string | null,
    email: string | null,
    hireable: string | null,
    bio: string | null,
    twitter_username: string | null,
    public_repos: number,
    public_gists: number,
    followers: number,
    following: number,
    created_at: string,
    updated_at: string
}