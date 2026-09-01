import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { salonId } from "./http.controller";
export async function notificationStream(request: Request, response: Response) {
  const tenant = salonId(response);
  let last = String(request.query.since ?? "");
  response
    .status(200)
    .set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
  response.flushHeaders();
  const send = async () => {
    const notifications = await prisma.notification.findMany({
      where: {
        salonId: tenant,
        ...(last ? { createdAt: { gt: new Date(last) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    for (const notification of notifications) {
      response.write(
        `event: notification\ndata: ${JSON.stringify(notification)}\n\n`,
      );
      last = notification.createdAt.toISOString();
    }
    response.write(": keepalive\n\n");
  };
  await send();
  const timer = setInterval(
    () => void send().catch(() => response.end()),
    10_000,
  );
  request.on("close", () => clearInterval(timer));
}
