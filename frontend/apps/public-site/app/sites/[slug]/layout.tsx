import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontStack, normalizeTemplate, resolveTheme } from "@/lib/theme";
import { getSite } from "@/lib/site";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSite(slug);
  if (!data) return { title: "Website not found", robots: { index: false } };
  const theme = resolveTheme(normalizeTemplate(data.site.templateId), data.site.theme);
  const title = theme.seoTitle ?? data.site.title;
  const description = theme.seoDescription ?? data.site.description ?? `Book appointments online at ${data.salon.name}.`;
  return { title: { default: title, template: `%s · ${data.salon.name}` }, description, openGraph: { title, description, type: "website", images: theme.heroImage ? [theme.heroImage] : undefined } };
}

export default async function SiteLayout({ children, params }: Props) {
  const { slug } = await params;
  const data = await getSite(slug);
  if (!data) notFound();
  const templateId = normalizeTemplate(data.site.templateId);
  const theme = resolveTheme(templateId, data.site.theme);
  const style = {
    "--primary": theme.primary,
    "--accent": theme.accent,
    "--bg": theme.background,
    "--text": theme.text,
    "--font": fontStack[theme.font],
  } as React.CSSProperties;
  const { salon } = data;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: salon.name,
    image: salon.logoUrl ?? theme.heroImage ?? undefined,
    telephone: salon.phone ?? undefined,
    email: salon.email ?? undefined,
    address: salon.address ? { "@type": "PostalAddress", streetAddress: salon.address, addressLocality: salon.city ?? undefined, addressRegion: salon.state ?? undefined, postalCode: salon.postalCode ?? undefined } : undefined,
    aggregateRating: data.rating.count ? { "@type": "AggregateRating", ratingValue: data.rating.average, reviewCount: data.rating.count } : undefined,
  };
  return (
    <div className="site" data-template={templateId} style={style}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <header className="nav">
        <Link href="/" className="brand">
          {salon.logoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={salon.logoUrl} alt="" /> : null}
          <span>{salon.name}</span>
        </Link>
        <nav>
          <Link href="/#services">Services</Link>
          {data.gallery.length > 0 && theme.sections.gallery && <Link href="/#gallery">Gallery</Link>}
          <Link href="/#contact">Contact</Link>
          <Link href="/book" className="btn small">Book now</Link>
        </nav>
      </header>
      {children}
      <footer className="footer">
        <div>
          <b>{salon.name}</b>
          <p className="muted">{[salon.address, salon.city].filter(Boolean).join(", ")}</p>
        </div>
        <div className="socials">
          {theme.social.instagram && <a href={theme.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {theme.social.facebook && <a href={theme.social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
          {theme.social.whatsapp && <a href={`https://wa.me/${theme.social.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        </div>
        <p className="muted small">Powered by DropXcutz</p>
      </footer>
    </div>
  );
}
