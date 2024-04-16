// Reexport your entry components here
import auth from "./src/auth.js";
export default auth;

import Github from "./providers/github.js";
import Kakao from "./providers/kakao.js";

export const providers = {
    Github,
    Kakao
}