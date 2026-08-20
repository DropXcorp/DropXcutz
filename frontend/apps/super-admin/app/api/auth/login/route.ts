import { NextResponse } from "next/server";
const backend = process.env.SALON_BACKEND_URL ?? "http://localhost:5000/api";
export async function POST(request: Request) {
  const response = await fetch(`${backend}/erp/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  });
  const result = new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
  const cookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie") as string] : []);
  for (const cookie of cookies) result.headers.append("set-cookie", cookie);
  return result;
}
