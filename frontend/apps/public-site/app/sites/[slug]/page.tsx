import Link from "next/link";
import { notFound } from "next/navigation";
import { formatTime, getSite, money } from "@/lib/site";
import { normalizeTemplate, resolveTheme } from "@/lib/theme";

const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

export default async function SiteHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getSite(slug);
  if (!data) notFound();
  const theme = resolveTheme(normalizeTemplate(data.site.templateId), data.site.theme);
  const { salon, services, offers, gallery, reviews, rating } = data;
  const mapQuery = encodeURIComponent([salon.name, salon.address, salon.city].filter(Boolean).join(", "));

  return (
    <main>
      <section className="hero" style={theme.heroImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.55)),url("${theme.heroImage.replace(/["\\()]/g, "")}")` } : undefined} data-image={theme.heroImage ? "true" : "false"}>
        <div className="container">
          <span className="eyebrow">{salon.city ? `${salon.city} · ` : ""}Online booking</span>
          <h1>{theme.heroTitle ?? data.site.title}</h1>
          <p>{theme.heroSubtitle ?? data.site.description ?? "Choose your service, your specialist and a time that suits you."}</p>
          <div className="actions">
            <Link className="btn" href="/book">Book appointment</Link>
            {salon.phone && <a className="btn ghost" href={`tel:${salon.phone}`}>Call {salon.phone}</a>}
          </div>
          {rating.count > 0 && (
            <p className="rating"><span aria-hidden>★</span> {rating.average} <span className="muted-on-hero">· {rating.count} review{rating.count === 1 ? "" : "s"}</span></p>
          )}
        </div>
      </section>

      {theme.sections.offers && offers.length > 0 && (
        <section className="section" id="offers">
          <div className="container">
            <h2>Current offers</h2>
            <div className="offers">
              {offers.map((offer) => (
                <article key={offer.id} className="offer">
                  <span className="badge">{offer.discountType === "PERCENTAGE" ? `${offer.discount}% off` : `${money(offer.discount, salon.currency)} off`}</span>
                  <h3>{offer.title}</h3>
                  {offer.description && <p className="muted">{offer.description}</p>}
                  <p className="muted small">Ends {new Date(offer.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {theme.sections.services && (
        <section className="section" id="services">
          <div className="container">
            <h2>Our services</h2>
            {services.length === 0 ? (
              <p className="muted">Services will appear here soon.</p>
            ) : (
              <div className="grid">
                {services.map((service) => (
                  <article key={service.id} className="card">
                    <h3>{service.name}</h3>
                    <p className="muted">{service.description || `${service.durationMinutes} minute treatment`}</p>
                    <div className="row">
                      <span className="price">{money(service.price, salon.currency)} <span className="muted small">· {service.durationMinutes} min</span></span>
                      <Link className="btn small" href={`/book?service=${service.id}`}>Book</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {theme.sections.gallery && gallery.length > 0 && (
        <section className="section alt" id="gallery">
          <div className="container">
            <h2>Gallery</h2>
            <div className="gallery">
              {gallery.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={image.id} src={image.imageUrl} alt={image.title ?? `${salon.name} gallery`} loading="lazy" />
              ))}
            </div>
          </div>
        </section>
      )}

      {theme.sections.reviews && reviews.length > 0 && (
        <section className="section" id="reviews">
          <div className="container">
            <h2>What clients say</h2>
            <div className="grid">
              {reviews.slice(0, 6).map((review) => (
                <blockquote key={review.id} className="card quote">
                  <p className="stars" aria-label={`${review.rating} out of 5`}>{stars(review.rating)}</p>
                  <p>“{review.text}”</p>
                  <footer className="muted small">— {review.name}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {theme.sections.contact && (
        <section className="section alt" id="contact">
          <div className="container contact">
            <div>
              <h2>Visit us</h2>
              <p>{[salon.address, salon.city, salon.state, salon.postalCode].filter(Boolean).join(", ") || "Address available on request."}</p>
              <p className="muted">Open daily {formatTime(salon.openingTime)} – {formatTime(salon.closingTime)}</p>
              <p>
                {salon.phone && <a href={`tel:${salon.phone}`}>{salon.phone}</a>}
                {salon.phone && salon.email && " · "}
                {salon.email && <a href={`mailto:${salon.email}`}>{salon.email}</a>}
              </p>
              <a className="btn ghost dark" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">Get directions</a>
            </div>
            <div className="cta-box">
              <h3>Ready for your next visit?</h3>
              <p className="muted">Book in under a minute — pick a service, a specialist and a time.</p>
              <Link className="btn" href="/book">Book appointment</Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
