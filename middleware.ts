import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/incomes", "/expenses", "/profile"];

/**
 * Redireciona para o host de APP_URL (ex.: www → apex) para evitar 404 quando o
 * subdomínio aponta ao deploy mas só o apex está na config, ou o inverso.
 * Não afeta previews *.vercel.app.
 */
function redirectToCanonicalAppHost(
  request: NextRequest
): NextResponse | null {
  const raw = process.env.APP_URL?.trim();
  if (!raw) return null;

  let canonical: URL;
  try {
    canonical = new URL(raw.replace(/\/+$/, ""));
  } catch {
    return null;
  }

  const want = canonical.hostname.toLowerCase();
  const current =
    request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (!current || current === want) return null;
  if (current.endsWith(".vercel.app")) return null;

  const dest = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    `${canonical.protocol}//${want}`
  );
  return NextResponse.redirect(dest, 308);
}

export function middleware(request: NextRequest) {
  const canonical = redirectToCanonicalAppHost(request);
  if (canonical) return canonical;

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("moneycontrol_session")?.value;

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Inclui /reset-password, /login, etc. Exclui API, _next e arquivos estáticos
     * (extensão no último segmento) para não quebrar assets públicos.
     */
    "/((?!api/|_next/|.*\\..*).*)"
  ]
};

