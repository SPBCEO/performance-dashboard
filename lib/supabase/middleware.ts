import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Reachable without a session. Everything else requires sign-in.
const PUBLIC_PREFIXES = ["/login", "/auth/", "/api/health", "/api/stripe/webhooks"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function redirectTo(request: NextRequest, source: NextResponse, path: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = search;
  const res = NextResponse.redirect(url);
  // keep any refreshed auth cookies on the redirect
  source.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Misconfigured env: only public paths may pass; never fail open to app data.
  if (!url || !anonKey) {
    return isPublic(pathname) ? response : redirectTo(request, response, "/login");
  }

  let signedIn = false;
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = !!data.user;
  } catch {
    signedIn = false; // fail closed
  }

  if (!signedIn && !isPublic(pathname)) {
    const next = pathname + search;
    return redirectTo(request, response, "/login", next === "/" ? "" : `?next=${encodeURIComponent(next)}`);
  }
  if (signedIn && pathname === "/login") {
    return redirectTo(request, response, "/");
  }
  return response;
}
