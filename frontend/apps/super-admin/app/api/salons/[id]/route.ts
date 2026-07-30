import { NextResponse } from "next/server";

const backend = process.env.SALON_BACKEND_URL ?? "http://localhost:5000/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await fetch(`${backend}/platform/salons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: request.headers.get("cookie") ?? "" },
    body: JSON.stringify(await request.json()),
  });
  return new NextResponse(await response.text(), { status: response.status, headers: { "content-type": "application/json" } });
}
