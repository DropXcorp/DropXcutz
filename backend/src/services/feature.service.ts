import { prisma } from "../config/prisma";

export type EffectiveFeature = {
  code: string;
  enabled: boolean;
  source: "PLAN" | "OVERRIDE";
};

/** Returns the current subscription's feature set with salon overrides applied. */
export async function getEffectiveFeatures(salonId: string): Promise<EffectiveFeature[]> {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      salonId,
      status: { in: ["ACTIVE", "TRIAL"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    include: { plan: { include: { features: { include: { feature: true } } } } },
  });
  const overrides = await prisma.salonFeature.findMany({
    where: { salonId },
    include: { feature: true },
  });
  // Overrides customize an active subscription; they never resurrect access
  // for an expired, suspended, or unassigned salon.
  if (!subscription) return [];
  const features = new Map<string, EffectiveFeature>();
  for (const item of subscription?.plan.features ?? []) {
    features.set(item.feature.code, { code: item.feature.code, enabled: item.enabled, source: "PLAN" });
  }
  for (const item of overrides) {
    features.set(item.feature.code, { code: item.feature.code, enabled: item.enabled, source: "OVERRIDE" });
  }
  return [...features.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export async function hasFeature(salonId: string, code: string): Promise<boolean> {
  return (await getEffectiveFeatures(salonId)).some((feature) => feature.code === code && feature.enabled);
}
