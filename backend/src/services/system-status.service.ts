import { prisma } from "../config/prisma";

export type Check = { key: string; label: string; ok: boolean; level: "required" | "recommended" | "optional"; detail: string };

const has = (name: string) => Boolean(process.env[name]?.trim());
const isProduction = process.env.NODE_ENV === "production";

function keyValid(name: string) {
  const value = process.env[name]?.trim();
  return Boolean(value && Buffer.from(value, "base64").length === 32);
}

/** Reports configuration health without ever returning a secret value. */
export async function collectSystemStatus(): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (key: string, label: string, ok: boolean, level: Check["level"], good: string, bad: string) =>
    checks.push({ key, label, ok, level, detail: ok ? good : bad });

  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }
  add("database", "Database connection", dbOk, "required", "Connected.", "Cannot reach the database. Check DATABASE_URL.");

  let migrated = true;
  try {
    await prisma.salonWebsiteSettings.findFirst({ select: { isPublished: true } });
    await prisma.automationJob.count();
  } catch {
    migrated = false;
  }
  add("migrations", "Database migrations", migrated, "required", "Up to date.", "Run `bunx prisma migrate deploy` — website/automation tables are missing.");

  add("jwt", "Session secret (JWT_SECRET)", (process.env.JWT_SECRET?.length ?? 0) >= 32, "required", "Configured.", "JWT_SECRET must be at least 32 characters.");
  add("cookies", "Cookie security", !isProduction || (process.env.COOKIE_SECURE === "true" || process.env.COOKIE_SAME_SITE?.toLowerCase() === "none"), "recommended", "Secure cookies in production.", "Set COOKIE_SECURE=true (and COOKIE_DOMAIN when apps share a parent domain).");
  add("origins", "Allowed app origins (FRONTEND_ORIGINS)", !isProduction || has("FRONTEND_ORIGINS"), "required", "Configured.", "Set FRONTEND_ORIGINS to your ERP and super-admin URLs.");
  add("payment-key", "Payment secret encryption key", keyValid("PAYMENT_CREDENTIALS_ENCRYPTION_KEY"), "required", "Valid 32-byte key.", "PAYMENT_CREDENTIALS_ENCRYPTION_KEY must be a base64-encoded 32-byte key — salons cannot save Razorpay keys without it.");
  add("smtp", "Email (SMTP)", has("SMTP_HOST") && has("SMTP_USER") && has("SMTP_PASS"), "recommended", "Configured — customers receive booking emails.", "SMTP_* not set — booking confirmations and reminders will not be sent.");
  add("root-domain", "Website root domain (PUBLIC_ROOT_DOMAIN)", has("PUBLIC_ROOT_DOMAIN"), "required", `Sites are served at name.${process.env.PUBLIC_ROOT_DOMAIN ?? ""}.`, "Set PUBLIC_ROOT_DOMAIN (e.g. mysalonapp.com) so published websites get an address.");
  add("public-site", "Public site URL (PUBLIC_SITE_URL)", has("PUBLIC_SITE_URL"), "recommended", "Configured.", "Set PUBLIC_SITE_URL — used for links in emails when a salon has no root domain.");
  add("revalidate", "Instant website refresh", has("PUBLIC_SITE_REVALIDATE_URL") && has("PUBLIC_SITE_REVALIDATE_SECRET"), "recommended", "Publishing updates sites immediately.", "Set PUBLIC_SITE_REVALIDATE_URL and PUBLIC_SITE_REVALIDATE_SECRET (sites otherwise refresh within about a minute).");
  add("vercel", "Automatic custom-domain SSL (Vercel)", has("VERCEL_API_TOKEN") && has("VERCEL_PROJECT_ID"), "optional", "Custom domains are attached automatically.", "Not configured — custom domains work only if your own proxy handles TLS.");
  add("api-url", "Public API URL (API_PUBLIC_URL)", has("API_PUBLIC_URL"), "recommended", "Configured.", "Set API_PUBLIC_URL so the Razorpay webhook URL shown to salons is correct behind a proxy.");
  add("platform-razorpay", "Platform billing (Razorpay)", has("RAZORPAY_KEY_ID") && has("RAZORPAY_KEY_SECRET") && has("RAZORPAY_WEBHOOK_SECRET"), "optional", "Salon subscription invoices can be paid online.", "RAZORPAY_* not set — platform invoices have no payment links.");
  return checks;
}

/** Called once at boot: fail on unsafe production config, warn about the rest. */
export async function logStartupConfig() {
  const checks = await collectSystemStatus().catch(() => []);
  const failing = checks.filter((check) => !check.ok);
  for (const check of failing) {
    const prefix = check.level === "required" ? "CONFIG (required)" : check.level === "recommended" ? "CONFIG (recommended)" : "CONFIG (optional)";
    if (check.level !== "optional") console.warn(`${prefix}: ${check.label} — ${check.detail}`);
  }
  if (isProduction && (process.env.JWT_SECRET?.length ?? 0) < 32) {
    console.error("JWT_SECRET is missing or too short. Refusing to start in production.");
    process.exit(1);
  }
}
