"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Check, Copy, ExternalLink, Globe, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { erpApi, useERPStore } from "@/src/lib/erp-store";

type SiteType = "NONE" | "TEMPLATE" | "CUSTOM";
type DomainStatus = "NONE" | "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED";
type Theme = {
  primary?: string; accent?: string; background?: string; text?: string;
  font?: "sans" | "serif" | "rounded";
  heroImage?: string; heroTitle?: string; heroSubtitle?: string;
  sections?: { services?: boolean; offers?: boolean; gallery?: boolean; reviews?: boolean; contact?: boolean };
  social?: { instagram?: string; facebook?: string; whatsapp?: string };
  seoTitle?: string; seoDescription?: string;
};
type Info = {
  slug: string;
  settings: {
    type: SiteType; title: string | null; description: string | null; templateId: string | null; theme: Theme | null;
    isPublished: boolean; publishedAt: string | null; customDomain: string | null; domainStatus: DomainStatus; domainError: string | null;
  } | null;
  urls: { subdomain: string | null; custom: string | null; live: string | null };
  dns: { cname: { host: string; value: string }; txt: { host: string; value: string } } | null;
};

const templates = [
  { id: "classic", name: "Classic", blurb: "Centered, elegant, timeless.", colors: ["#18181b", "#b45309", "#ffffff"] },
  { id: "modern", name: "Modern", blurb: "Rounded, colourful and friendly.", colors: ["#7c3aed", "#ec4899", "#faf5ff"] },
  { id: "minimal", name: "Minimal", blurb: "Clean, quiet, editorial.", colors: ["#0f172a", "#0f766e", "#f8fafc"] },
] as const;

const field = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-50";
const label = "mb-1.5 block text-xs font-semibold text-foreground/80";
const card = "rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border";

const say = {
  ok: (message: string) => useERPStore.setState({ successMessage: message, error: null }),
  fail: (cause: unknown) => useERPStore.setState({ error: cause instanceof Error ? cause.message : "Something went wrong." }),
};

const statusStyle: Record<DomainStatus, string> = {
  NONE: "bg-muted text-muted-foreground",
  PENDING_DNS: "bg-amber-100 text-amber-800",
  VERIFYING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};
const statusText: Record<DomainStatus, string> = {
  NONE: "Not connected", PENDING_DNS: "Waiting for DNS", VERIFYING: "Verifying & issuing SSL", ACTIVE: "Live", FAILED: "Needs attention",
};

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label="Copy" className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
      onClick={() => { void navigator.clipboard.writeText(value).then(() => { setDone(true); window.setTimeout(() => setDone(false), 1500); }); }}>
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </button>
  );
}

function WebsiteStudio() {
  const features = useERPStore((state) => state.features);
  const canTemplate = features.includes("TEMPLATE_WEBSITE");
  const canCustom = features.includes("CUSTOM_WEBSITE");
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "design" | "domain">("overview");
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<SiteType>("NONE");
  const [templateId, setTemplateId] = useState("classic");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<Theme>({});
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [qr, setQr] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const apply = useCallback((next: Info) => {
    setInfo(next);
    const settings = next.settings;
    setType(settings?.type ?? "NONE");
    setTemplateId(settings?.templateId ?? "classic");
    setTitle(settings?.title ?? "");
    setDescription(settings?.description ?? "");
    setTheme(settings?.theme ?? {});
    setSlug(next.slug);
    setDomain(settings?.customDomain ?? "");
  }, []);

  const load = useCallback(async () => {
    try {
      apply(await erpApi<Info>("/website-settings"));
    } catch (cause) {
      say.fail(cause);
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => { void load(); }, [load]);

  const live = info?.urls.live ?? null;
  const published = Boolean(info?.settings?.isPublished);
  useEffect(() => {
    if (!live) { setQr(""); return; }
    void QRCode.toDataURL(live, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(""));
  }, [live]);

  const domainStatus = info?.settings?.domainStatus ?? "NONE";
  useEffect(() => {
    if (domainStatus !== "PENDING_DNS" && domainStatus !== "VERIFYING") return;
    const timer = window.setInterval(() => { void erpApi<Info>("/website-settings/domain/verify", { method: "POST" }).then(apply).catch(() => undefined); }, 30_000);
    return () => window.clearInterval(timer);
  }, [domainStatus, apply]);

  const dirty = useMemo(() => {
    const s = info?.settings;
    return (
      type !== (s?.type ?? "NONE") || templateId !== (s?.templateId ?? "classic") || title !== (s?.title ?? "") ||
      description !== (s?.description ?? "") || JSON.stringify(theme) !== JSON.stringify(s?.theme ?? {})
    );
  }, [info, type, templateId, title, description, theme]);

  const put = async (path: string, body: unknown, success: string, method = "PUT") => {
    setSaving(true);
    try {
      apply(await erpApi<Info>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }));
      say.ok(success);
      setPreviewKey((value) => value + 1);
      return true;
    } catch (cause) {
      say.fail(cause);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = (extra: { isPublished?: boolean } = {}) =>
    put("/website-settings", { type, templateId, title: title.trim() || null, description: description.trim() || null, theme, ...extra }, extra.isPublished === undefined ? "Website saved." : extra.isPublished ? "Website published." : "Website unpublished.");

  const setColor = (key: "primary" | "accent" | "background" | "text", value: string) => setTheme((current) => ({ ...current, [key]: value }));
  const section = (key: keyof NonNullable<Theme["sections"]>) => theme.sections?.[key] !== false;
  const toggleSection = (key: keyof NonNullable<Theme["sections"]>) => setTheme((current) => ({ ...current, sections: { ...current.sections, [key]: current.sections?.[key] === false } }));
  const preset = templates.find((item) => item.id === templateId) ?? templates[0];

  if (loading) {
    return <div className="mx-auto max-w-5xl space-y-4"><div className="h-28 animate-pulse rounded-2xl bg-muted/60" /><div className="h-64 animate-pulse rounded-2xl bg-muted/60" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><Globe className="size-6" /></div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Website</h1>
            <p className="text-sm text-muted-foreground">Take bookings online with your own salon website.</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${published ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
          {published ? "Published" : type === "NONE" ? "Not set up" : "Draft"}
        </span>
      </header>

      <div role="tablist" className="inline-flex rounded-xl bg-muted p-1">
        {(["overview", "design", "domain"] as const).map((item) => (
          <button key={item} role="tab" type="button" aria-selected={tab === item} onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${tab === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {item === "domain" ? "Custom domain" : item}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className={`${card} space-y-5`}>
            <div>
              <h2 className="font-semibold">Website type</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Choose how customers will book online.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                { value: "TEMPLATE", name: "Template site", blurb: "We build and host it for you.", allowed: canTemplate },
                { value: "CUSTOM", name: "Custom site", blurb: "Your developer uses our API.", allowed: canCustom },
                { value: "NONE", name: "No website", blurb: "Bookings from the ERP only.", allowed: true },
              ] as const).map((option) => (
                <button key={option.value} type="button" disabled={!option.allowed} onClick={() => setType(option.value)}
                  className={`rounded-xl border p-4 text-left transition ${type === option.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/40"} disabled:cursor-not-allowed disabled:opacity-50`}>
                  <p className="font-semibold">{option.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.allowed ? option.blurb : "Not in your plan — ask the platform admin."}</p>
                </button>
              ))}
            </div>

            {type === "TEMPLATE" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="site-title">Site title</label>
                  <input id="site-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AuraNest Beauty Studio" maxLength={160} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="site-desc">Short description</label>
                  <textarea id="site-desc" className={`${field} h-auto min-h-20 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hair, skin and spa services in the heart of the city." />
                </div>
              </div>
            )}

            {type === "CUSTOM" && (
              <div className="rounded-xl bg-muted/50 p-4 text-sm">
                <p className="font-semibold">Connect your own website</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                  <li>Create an API key and list your website&apos;s domain in <Link className="font-medium text-foreground underline" href="/settings/api">API & integrations</Link> (wildcards like *.yoursalon.com work).</li>
                  <li>Call the public API from your site with the <code className="rounded bg-muted px-1">X-DropXcutz-Key</code> header.</li>
                  <li>Come back here and tick <b>Publish</b> when you&apos;re ready.</li>
                </ol>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button disabled={saving || !dirty || type === "NONE" && !info?.settings} onClick={() => void save()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}Save changes
              </Button>
              {type !== "NONE" && (
                published ? (
                  <Button variant="outline" disabled={saving} onClick={() => void save({ isPublished: false })}>Unpublish</Button>
                ) : (
                  <Button variant="secondary" disabled={saving || dirty && !info?.settings} onClick={() => void save({ isPublished: true })}>
                    <Sparkles className="size-4" /> {dirty ? "Save & publish" : "Publish website"}
                  </Button>
                )
              )}
              {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
            </div>
          </section>

          <aside className="space-y-6">
            <section className={`${card} space-y-4`}>
              <h2 className="font-semibold">Your address</h2>
              {live ? (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <a href={live} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline">{live}</a>
                  <span className="flex shrink-0 items-center"><CopyButton value={live} /><a aria-label="Open" href={live} target="_blank" rel="noopener noreferrer" className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><ExternalLink className="size-4" /></a></span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Your live address appears here once your platform admin sets the site domain.</p>
              )}
              <div>
                <label className={label} htmlFor="slug">Site name (address)</label>
                <div className="flex gap-2">
                  <input id="slug" className={field} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={60} />
                  <Button variant="outline" disabled={saving || !slug || slug === info?.slug} onClick={() => void put("/website-settings/slug", { slug }, "Address updated.")}>Save</Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Changing this changes your web address — old links stop working.</p>
              </div>
              {qr && live && published && (
                <div className="flex items-center gap-4 border-t pt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR code for your website" className="size-24 rounded-lg ring-1 ring-border" />
                  <div className="text-sm"><p className="font-medium">Booking QR code</p><p className="text-xs text-muted-foreground">Print it for your reception or flyers.</p><a className="mt-1 inline-block text-xs font-medium underline" href={qr} download="salon-booking-qr.png">Download</a></div>
                </div>
              )}
            </section>
            <section className={card}>
              <h2 className="font-semibold">Before you publish</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>• Add public services and bookable staff (Services / Employees).</li>
                <li>• Add photos in <Link className="underline" href="/marketing">Offers & gallery</Link>.</li>
                <li>• Set up <Link className="underline" href="/settings/integration">online payments</Link> (optional).</li>
              </ul>
            </section>
          </aside>
        </div>
      )}

      {tab === "design" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <section className={card}>
              <h2 className="font-semibold">Template</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {templates.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setTemplateId(item.id); setTheme((current) => ({ ...current, primary: undefined, accent: undefined, background: undefined, text: undefined })); }}
                    className={`rounded-xl border p-3 text-left transition ${templateId === item.id ? "border-primary ring-1 ring-primary" : "border-border hover:bg-muted/40"}`}>
                    <div className="flex h-14 overflow-hidden rounded-lg ring-1 ring-border">
                      {item.colors.map((color) => <span key={color} className="flex-1" style={{ background: color }} />)}
                    </div>
                    <p className="mt-2 font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.blurb}</p>
                  </button>
                ))}
              </div>
            </section>
            <section className={`${card} space-y-4`}>
              <h2 className="font-semibold">Colours & style</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {([["primary", "Primary"], ["accent", "Accent"], ["background", "Background"], ["text", "Text"]] as const).map(([key, name]) => (
                  <label key={key} className="text-xs font-semibold text-foreground/80">{name}
                    <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-input bg-card p-1.5">
                      <input type="color" className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" value={theme[key] ?? preset.colors[key === "primary" ? 0 : key === "accent" ? 1 : key === "background" ? 2 : 0]} onChange={(e) => setColor(key, e.target.value)} />
                      <span className="font-mono text-[11px] font-normal text-muted-foreground">{theme[key] ?? "default"}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className={label} htmlFor="font">Font style</label>
                <select id="font" className={field} value={theme.font ?? ""} onChange={(e) => setTheme({ ...theme, font: (e.target.value || undefined) as Theme["font"] })}>
                  <option value="">Template default</option><option value="sans">Clean sans-serif</option><option value="serif">Elegant serif</option><option value="rounded">Friendly rounded</option>
                </select>
              </div>
            </section>
            <section className={`${card} space-y-4`}>
              <h2 className="font-semibold">Homepage content</h2>
              <div><label className={label} htmlFor="hero-title">Headline</label><input id="hero-title" className={field} value={theme.heroTitle ?? ""} maxLength={80} onChange={(e) => setTheme({ ...theme, heroTitle: e.target.value })} placeholder="Defaults to your site title" /></div>
              <div><label className={label} htmlFor="hero-sub">Sub-headline</label><input id="hero-sub" className={field} value={theme.heroSubtitle ?? ""} maxLength={160} onChange={(e) => setTheme({ ...theme, heroSubtitle: e.target.value })} /></div>
              <div><label className={label} htmlFor="hero-img">Hero image URL</label><input id="hero-img" type="url" className={field} value={theme.heroImage ?? ""} onChange={(e) => setTheme({ ...theme, heroImage: e.target.value })} placeholder="https://…" /></div>
              <div>
                <p className={label}>Sections to show</p>
                <div className="flex flex-wrap gap-2">
                  {(["services", "offers", "gallery", "reviews", "contact"] as const).map((key) => (
                    <button key={key} type="button" aria-pressed={section(key)} onClick={() => toggleSection(key)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${section(key) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{key}</button>
                  ))}
                </div>
              </div>
            </section>
            <section className={`${card} space-y-4`}>
              <h2 className="font-semibold">Social & search</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className={label} htmlFor="ig">Instagram URL</label><input id="ig" type="url" className={field} value={theme.social?.instagram ?? ""} onChange={(e) => setTheme({ ...theme, social: { ...theme.social, instagram: e.target.value } })} /></div>
                <div><label className={label} htmlFor="fb">Facebook URL</label><input id="fb" type="url" className={field} value={theme.social?.facebook ?? ""} onChange={(e) => setTheme({ ...theme, social: { ...theme.social, facebook: e.target.value } })} /></div>
                <div><label className={label} htmlFor="wa">WhatsApp number</label><input id="wa" type="tel" className={field} value={theme.social?.whatsapp ?? ""} onChange={(e) => setTheme({ ...theme, social: { ...theme.social, whatsapp: e.target.value } })} placeholder="919876543210" /></div>
              </div>
              <div><label className={label} htmlFor="seo-t">Google title</label><input id="seo-t" className={field} value={theme.seoTitle ?? ""} maxLength={70} onChange={(e) => setTheme({ ...theme, seoTitle: e.target.value })} /></div>
              <div><label className={label} htmlFor="seo-d">Google description</label><textarea id="seo-d" className={`${field} h-auto min-h-16 py-2`} maxLength={160} value={theme.seoDescription ?? ""} onChange={(e) => setTheme({ ...theme, seoDescription: e.target.value })} /></div>
            </section>
            <div className="flex items-center gap-3">
              <Button disabled={saving || !dirty} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save design</Button>
              {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
            </div>
          </div>

          <aside className={`${card} h-fit space-y-3 lg:sticky lg:top-4`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Live preview</h2>
              <button type="button" aria-label="Refresh preview" className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => setPreviewKey((value) => value + 1)}><RefreshCw className="size-4" /></button>
            </div>
            {live && published ? (
              <>
                <iframe key={previewKey} title="Website preview" src={live} className="h-[520px] w-full rounded-xl bg-white ring-1 ring-border" />
                <p className="text-xs text-muted-foreground">Save your changes, then refresh — the preview shows your published site.</p>
              </>
            ) : (
              <p className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">Publish your website to see a live preview here.</p>
            )}
          </aside>
        </div>
      )}

      {tab === "domain" && (
        <section className={`${card} max-w-3xl space-y-5`}>
          <div>
            <h2 className="font-semibold">Use your own domain</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Show your website at an address like <b>www.yoursalon.com</b>. We handle the security certificate automatically.</p>
          </div>
          {!canCustom ? (
            <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Custom domains aren&apos;t included in your plan. Ask the platform admin to enable them.</p>
          ) : !info?.settings || info.settings.type === "NONE" ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Choose a website type on the Overview tab and save first.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <input aria-label="Domain" className={`${field} max-w-sm`} placeholder="www.yoursalon.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
                <Button disabled={saving || !domain.trim() || domain.trim() === info.settings.customDomain} onClick={() => void put("/website-settings/domain", { domain }, "Domain saved. Now add the DNS records below.")}>Connect domain</Button>
                {info.settings.customDomain && <Button variant="outline" disabled={saving} onClick={() => void put("/website-settings/domain", { domain: null }, "Domain removed.").then((ok) => ok && setDomain(""))}>Remove</Button>}
              </div>
              {info.settings.customDomain && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[domainStatus]}`}>{statusText[domainStatus]}</span>
                    <Button variant="outline" size="sm" disabled={saving} onClick={() => void put("/website-settings/domain/verify", undefined, "Checked DNS.", "POST")}><RefreshCw className="size-3.5" /> Check now</Button>
                    {(domainStatus === "PENDING_DNS" || domainStatus === "VERIFYING") && <span className="text-xs text-muted-foreground">We re-check automatically every few minutes.</span>}
                  </div>
                  {info.settings.domainError && domainStatus !== "ACTIVE" && <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{info.settings.domainError}</p>}
                  {info.dns && (
                    <div className="overflow-hidden rounded-xl ring-1 ring-border">
                      <p className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add these records at your domain provider</p>
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2">Type</th><th className="px-4 py-2">Name / Host</th><th className="px-4 py-2">Value</th><th /></tr></thead>
                        <tbody className="divide-y">
                          <tr><td className="px-4 py-2 font-mono">CNAME</td><td className="px-4 py-2 font-mono">{info.dns.cname.host}</td><td className="px-4 py-2 font-mono">{info.dns.cname.value}</td><td className="pr-2"><CopyButton value={info.dns.cname.value} /></td></tr>
                          <tr><td className="px-4 py-2 font-mono">TXT</td><td className="px-4 py-2 font-mono break-all">{info.dns.txt.host}</td><td className="px-4 py-2 font-mono break-all">{info.dns.txt.value}</td><td className="pr-2"><CopyButton value={info.dns.txt.value} /></td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {domainStatus === "ACTIVE" && info.urls.custom && <p className="text-sm">Your website is live at <a className="font-medium underline" href={info.urls.custom} target="_blank" rel="noopener noreferrer">{info.urls.custom}</a>.</p>}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export function Unavailable({ title }: { title: string }) {
  return (
    <div className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-4 text-center">
      <div className="rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
        <h1 className="text-xl font-semibold text-foreground">Feature unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

export default function WebsiteSettingsPanel() {
  const features = useERPStore((state) => state.features);
  if (!features.includes("WEBSITE_MANAGEMENT"))
    return <Unavailable title="Website management is not included in this plan." />;
  return <WebsiteStudio />;
}
