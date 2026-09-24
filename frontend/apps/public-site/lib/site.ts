import { assertConfigured, serverApiUrl } from "./config";

export type SiteSalon = {
  slug: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  openingTime: string;
  closingTime: string;
  timezone: string;
  currency: string;
  onlinePaymentsConfigured: boolean;
};
export type SiteService = { id: string; name: string; description: string | null; price: number; durationMinutes: number };
export type SiteData = {
  salon: SiteSalon;
  site: { title: string; description: string | null; templateId: string; theme: unknown };
  offers: { id: string; title: string; description: string | null; bannerImage: string | null; discount: number; discountType: "PERCENTAGE" | "FIXED"; endDate: string }[];
  gallery: { id: string; imageUrl: string; title: string | null }[];
  reviews: { id: string; rating: number; text: string | null; name: string; createdAt: string }[];
  rating: { average: number | null; count: number };
  services: SiteService[];
};

export async function getSite(slug: string): Promise<SiteData | null> {
  assertConfigured();
  const response = await fetch(`${serverApiUrl}/public/v1/salons/${encodeURIComponent(slug)}/site`, {
    next: { revalidate: 60, tags: [`site:${slug}`, "sites"] },
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const body = (await response.json().catch(() => null)) as { data?: SiteData } | null;
  return body?.data ?? null;
}

export const money = (value: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export const formatTime = (value: string) => {
  const [h = "0", m = "0"] = value.split(":");
  return new Date(2000, 0, 1, Number(h), Number(m)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};
