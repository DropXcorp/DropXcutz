import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { hasFeature } from "../services/feature.service";
import { salonForPublic } from "./public-booking.controller";

type Resolved = { slug: string; expiresAt: number };
const cache = new Map<string, Resolved | null>();
const ttlMs = 30_000;
const stamp = new Map<string, number>();

function slugFromHost(host: string) {
  const root = process.env.PUBLIC_ROOT_DOMAIN?.trim().toLowerCase();
  if (root && host.endsWith(`.${root}`)) {
    const label = host.slice(0, -(root.length + 1));
    return /^[a-z0-9-]+$/.test(label) ? label : null;
  }
  // Local development: acme.localhost:3002
  if (host.endsWith(".localhost")) return host.slice(0, -".localhost".length) || null;
  return null;
}

/** Maps a visitor's host name to a published template site. Used by the multi-tenant public-site middleware. */
export async function resolveSite(request: Request, response: Response) {
  const host = String(request.query.host ?? "").trim().toLowerCase().replace(/:\d+$/, "");
  if (!host || host.length > 253) throw new ApiError(400, "A host is required.");
  const hit = stamp.get(host);
  if (hit && Date.now() - hit < ttlMs) {
    const cached = cache.get(host);
    if (!cached) throw new ApiError(404, "No website is published for this address.");
    response.setHeader("Cache-Control", "public, max-age=30");
    response.json({ data: { slug: cached.slug } });
    return;
  }

  const bySlug = slugFromHost(host);
  const alternates = host.startsWith("www.") ? [host, host.slice(4)] : [host, `www.${host}`];
  const salon = bySlug
    ? await prisma.salon.findUnique({ where: { slug: bySlug }, include: { websiteSettings: true } })
    : await prisma.salon.findFirst({
        where: { websiteSettings: { customDomain: { in: alternates }, domainStatus: "ACTIVE" } },
        include: { websiteSettings: true },
      });

  const live =
    salon &&
    ["ACTIVE", "TRIAL"].includes(salon.status) &&
    salon.websiteSettings?.type === "TEMPLATE" &&
    salon.websiteSettings.isPublished &&
    (await hasFeature(salon.id, "TEMPLATE_WEBSITE"));
  stamp.set(host, Date.now());
  cache.set(host, live && salon ? { slug: salon.slug, expiresAt: Date.now() + ttlMs } : null);
  if (!live || !salon) throw new ApiError(404, "No website is published for this address.");
  response.setHeader("Cache-Control", "public, max-age=30");
  response.json({ data: { slug: salon.slug } });
}

/** Everything a template site needs to render its home page in one request. */
export async function publicSite(_request: Request, response: Response) {
  const salon = await salonForPublic(response);
  const now = new Date();
  const [settings, offers, gallery, reviews, services] = await Promise.all([
    prisma.salonWebsiteSettings.findUnique({ where: { salonId: salon.id } }),
    prisma.offer.findMany({
      where: { salonId: salon.id, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { endDate: "asc" },
      take: 6,
    }),
    prisma.galleryImage.findMany({ where: { salonId: salon.id }, orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 24 }),
    prisma.review.findMany({
      where: { salonId: salon.id, status: "APPROVED", review: { not: null } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.service.findMany({ where: { salonId: salon.id, active: true, isPublic: true }, orderBy: { name: "asc" } }),
  ]);
  const rated = await prisma.review.aggregate({
    where: { salonId: salon.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  response.json({
    data: {
      salon: {
        slug: salon.slug,
        name: salon.salonName,
        logoUrl: salon.logoUrl,
        phone: salon.phone,
        email: salon.email,
        address: salon.address,
        city: salon.city,
        state: salon.state,
        postalCode: salon.postalCode,
        openingTime: salon.openingTime,
        closingTime: salon.closingTime,
        timezone: salon.timezone,
        currency: salon.currency,
        onlinePaymentsConfigured: Boolean(salon.allowOnlinePayments && salon.razorpayKeyId && salon.razorpayKeySecretCipher),
      },
      site: {
        title: settings?.title ?? salon.salonName,
        description: settings?.description ?? null,
        templateId: settings?.templateId ?? "classic",
        theme: settings?.theme ?? null,
      },
      offers: offers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        bannerImage: offer.bannerImage,
        discount: Number(offer.discount),
        discountType: offer.discountType,
        endDate: offer.endDate,
      })),
      gallery: gallery.map((image) => ({ id: image.id, imageUrl: image.imageUrl, title: image.title })),
      reviews: reviews.map((item) => ({ id: item.id, rating: item.rating, text: item.review, name: item.customer.name.split(" ")[0], createdAt: item.createdAt })),
      rating: { average: rated._avg.rating ? Math.round(rated._avg.rating * 10) / 10 : null, count: rated._count.rating },
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
      })),
    },
  });
}
