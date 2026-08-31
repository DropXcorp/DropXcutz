export const PLATFORM_PERMISSIONS = [
  "SALON_MANAGEMENT",
  "BILLING",
  "REPORTING",
  "ROLE_MANAGEMENT",
  "SECURITY",
  "SUPPORT_TICKETS",
  "BULK_OPERATIONS",
] as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

export function hasPlatformPermission(
  user: { role: string; platformRole?: { permissions: { permission: string }[] } | null },
  permission: PlatformPermission,
) {
  if (user.role !== "PLATFORM_ADMIN") return false;
  // Existing platform admins have full access until a custom role is assigned.
  if (!user.platformRole) return true;
  return user.platformRole.permissions.some((item) => item.permission === permission);
}
