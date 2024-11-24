// Reexport your entry components here
import auth from "./src/auth.js";
export default auth;

import Provider from "./src/provider.js";
export { Provider };

import Github from "./providers/github.js";
import Kakao from "./providers/kakao.js";
import Naver from "./providers/naver.js";

export const providers = {
    Github,
    Kakao,
    Naver,
    Line
}

import { type User } from "./src/types.js";
import Line from "./providers/line.js";
export type { User };