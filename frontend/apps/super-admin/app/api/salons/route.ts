import { NextResponse } from "next/server";

const backend = process.env.SALON_BACKEND_URL ?? "http://localhost:5000/api";

async function forward(
  request: Request,
  method: "GET" | "POST",
  body?: unknown,
) {
  const response = await fetch(`${backend}/platform/salons`, {
    method,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(request: Request) {
  return forward(request, "GET");
}
export async function POST(request: Request) {
  return forward(request, "POST", await request.json());
}
