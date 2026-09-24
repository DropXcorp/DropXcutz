import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingFlow from "@/components/BookingFlow";
import { getSite } from "@/lib/site";
import { normalizeTemplate, resolveTheme } from "@/lib/theme";

export const metadata: Metadata = { title: "Book an appointment" };

export default async function BookPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ service?: string }> }) {
  const { slug } = await params;
  const { service } = await searchParams;
  const data = await getSite(slug);
  if (!data) notFound();
  const theme = resolveTheme(normalizeTemplate(data.site.templateId), data.site.theme);
  return (
    <main className="section">
      <div className="container narrow">
        <h1 className="page-title">Book your appointment</h1>
        <p className="muted">{data.salon.name}</p>
        <BookingFlow slug={slug} salon={data.salon} services={data.services} initialServiceId={service} primary={theme.primary} />
      </div>
    </main>
  );
}
