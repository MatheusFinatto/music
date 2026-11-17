import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Tudo, menos: API, internos do Next, o Laboratório (estático) e arquivos com extensão.
  matcher: "/((?!api|_next|_vercel|laboratorio|.*\\..*).*)",
};
