import { NextResponse } from "next/server";

const backend = process.env.SALON_BACKEND_URL ?? "http://localhost:5000/api";

async function forward(request: Request, resource: string[], method: string) {
  const response = await fetch(
    `${backend}/platform/${resource.map(encodeURIComponent).join("/")}`,
    {
      method,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      ...(method !== "GET" ? { body: await request.text() } : {}),
    },
  );
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resource: string[] }> },
) {
  return forward(request, (await params).resource, "PATCH");
}
