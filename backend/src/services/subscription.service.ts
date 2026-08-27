import { prisma } from "../config/prisma";

/** Keeps persisted subscription status aligned with expiry; entitlement checks remain the final guard. */
export async function expireSubscriptions() {
  return prisma.subscription.updateMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] }, expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
}
