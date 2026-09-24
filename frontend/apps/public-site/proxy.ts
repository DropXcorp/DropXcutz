import { NextResponse, type NextRequest } from "next/server";
import { serverApiUrl } from "./lib/config";

const isProduction = process.env.NODE_ENV === "production";
const cache = new Map<string, { slug: string | null; expires: number }>();

async function resolve(host: string) {
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.slug;
  let slug: string | null = null;
  try {
    const response = await fetch(`${serverApiUrl}/public/v1/sites/resolve?host=${encodeURIComponent(host)}`, { cache: "no-store" });
    if (response.ok) slug = ((await response.json()) as { data?: { slug?: string } }).data?.slug ?? null;
  } catch {
    // API unreachable: don't cache the miss for long so we recover quickly.
    cache.set(host, { slug: null, expires: Date.now() + 5_000 });
    return null;
  }
  cache.set(host, { slug, expires: Date.now() + 30_000 });
  return slug;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");

  // Local development on plain "localhost": pick the salon with ?salon=<slug> (remembered in a cookie).
  let slug: string | null = null;
  let remember: string | null = null;
  if (!isProduction && (host === "localhost" || host === "127.0.0.1")) {
    const wanted = searchParams.get("salon") ?? request.cookies.get("dx_salon")?.value ?? null;
    if (wanted && /^[a-z0-9-]{2,60}$/.test(wanted)) {
      slug = wanted;
      remember = wanted;
    }
  } else {
    slug = await resolve(host);
  }

  if (!slug) {
    return NextResponse.rewrite(new URL("/site-not-found", request.url), { status: 404 });
  }
  const target = new URL(`/sites/${slug}${pathname === "/" ? "" : pathname}`, request.url);
  const response = NextResponse.rewrite(target);
  if (remember) response.cookies.set("dx_salon", remember, { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/|api/|site-not-found|favicon\.ico|.*\.(?:png|jpg|jpeg|svg|webp|ico|css|js|map|txt\.bak)$).*)"],
};
