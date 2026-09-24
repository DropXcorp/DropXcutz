export type TemplateId = "classic" | "modern" | "minimal";

export type SiteTheme = {
  primary: string;
  accent: string;
  background: string;
  text: string;
  font: "sans" | "serif" | "rounded";
  heroImage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  sections: { services: boolean; offers: boolean; gallery: boolean; reviews: boolean; contact: boolean };
  social: { instagram: string; facebook: string; whatsapp: string };
  seoTitle: string | null;
  seoDescription: string | null;
};

const presets: Record<TemplateId, Pick<SiteTheme, "primary" | "accent" | "background" | "text" | "font">> = {
  classic: { primary: "#18181b", accent: "#b45309", background: "#ffffff", text: "#18181b", font: "sans" },
  modern: { primary: "#7c3aed", accent: "#ec4899", background: "#faf5ff", text: "#1e1b4b", font: "rounded" },
  minimal: { primary: "#0f172a", accent: "#0f766e", background: "#f8fafc", text: "#0f172a", font: "serif" },
};

const color = (value: unknown, fallback: string) =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : fallback;
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const url = (value: unknown) => {
  const raw = text(value);
  return raw && /^https?:\/\//i.test(raw) ? raw : null;
};

export function normalizeTemplate(value: unknown): TemplateId {
  return value === "modern" || value === "minimal" ? value : "classic";
}

/** Turns the stored (untrusted) theme JSON into a safe, fully-populated theme. */
export function resolveTheme(templateId: TemplateId, raw: unknown): SiteTheme {
  const stored = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const base = presets[templateId];
  const sections = (stored.sections && typeof stored.sections === "object" ? stored.sections : {}) as Record<string, unknown>;
  const social = (stored.social && typeof stored.social === "object" ? stored.social : {}) as Record<string, unknown>;
  const flag = (key: string) => sections[key] !== false;
  return {
    primary: color(stored.primary, base.primary),
    accent: color(stored.accent, base.accent),
    background: color(stored.background, base.background),
    text: color(stored.text, base.text),
    font: stored.font === "serif" || stored.font === "rounded" || stored.font === "sans" ? stored.font : base.font,
    heroImage: url(stored.heroImage),
    heroTitle: text(stored.heroTitle),
    heroSubtitle: text(stored.heroSubtitle),
    sections: { services: flag("services"), offers: flag("offers"), gallery: flag("gallery"), reviews: flag("reviews"), contact: flag("contact") },
    social: { instagram: url(social.instagram) ?? "", facebook: url(social.facebook) ?? "", whatsapp: text(social.whatsapp)?.replace(/[^\d]/g, "") ?? "" },
    seoTitle: text(stored.seoTitle),
    seoDescription: text(stored.seoDescription),
  };
}

export const fontStack: Record<SiteTheme["font"], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
};
