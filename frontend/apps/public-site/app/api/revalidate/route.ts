import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET ?? "";
  const provided = request.headers.get("x-revalidate-secret") ?? "";
  const valid = expected.length > 0 && expected.length === provided.length && timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  if (!valid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { slug?: string | null };
  revalidateTag(body.slug ? `site:${body.slug}` : "sites", "max");
  return Response.json({ revalidated: true });
}
