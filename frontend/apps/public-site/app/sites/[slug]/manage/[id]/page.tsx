import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManageBooking from "@/components/ManageBooking";
import { getSite } from "@/lib/site";
import { normalizeTemplate, resolveTheme } from "@/lib/theme";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

export default async function ManagePage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ token?: string; paid?: string; booked?: string }> }) {
  const { slug, id } = await params;
  const query = await searchParams;
  const data = await getSite(slug);
  if (!data) notFound();
  const theme = resolveTheme(normalizeTemplate(data.site.templateId), data.site.theme);
  return (
    <main className="section">
      <div className="container narrow">
        <ManageBooking slug={slug} id={id} token={query.token ?? ""} flash={query.paid ? "paid" : query.booked ? "booked" : undefined} primary={theme.primary} paymentsOn={data.salon.onlinePaymentsConfigured} />
      </div>
    </main>
  );
}
