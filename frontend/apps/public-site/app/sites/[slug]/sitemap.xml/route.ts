export async function GET(request: Request) {
  const origin = new URL(request.headers.get("x-forwarded-host") ? `https://${request.headers.get("x-forwarded-host")}` : request.url).origin;
  const urls = ["/", "/book"].map((path) => `<url><loc>${origin}${path}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "content-type": "application/xml" } });
}
