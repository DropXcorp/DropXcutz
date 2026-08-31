"use client";

import { useEffect, useState } from "react";
import { Globe, Save } from "lucide-react";
import { useERPStore, type WebsiteSettings } from "@/src/lib/erp-store";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

const defaults: WebsiteSettings = {
  type: "NONE",
  title: "",
  description: "",
  customDomain: "",
  theme: null,
};

export default function WebsiteSettingsPanel() {
  const {
    features,
    websiteSettings,
    fetchWebsiteSettings,
    saveWebsiteSettings,
  } = useERPStore();
  useEffect(() => {
    void fetchWebsiteSettings();
  }, [fetchWebsiteSettings]);

  if (!features.includes("WEBSITE_MANAGEMENT")) {
    return (
      <Unavailable title="Website management is not included in this plan." />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-950">
              Website settings
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Configure how this salon is represented on its public website.
            </p>
          </div>
        </div>
      </header>
      <WebsiteSettingsForm
        key={websiteSettings?.updatedAt ?? "new"}
        initial={websiteSettings ?? defaults}
        saveWebsiteSettings={saveWebsiteSettings}
      />
    </div>
  );
}

function WebsiteSettingsForm({
  initial,
  saveWebsiteSettings,
}: {
  initial: WebsiteSettings;
  saveWebsiteSettings: (input: WebsiteSettings) => Promise<void>;
}) {
  const [form, setForm] = useState<WebsiteSettings>({
    ...defaults,
    ...initial,
  });
  return (
    <form
      className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void saveWebsiteSettings({
          ...form,
          title: form.title?.trim() || null,
          description: form.description?.trim() || null,
          customDomain: form.customDomain?.trim() || null,
        });
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-800">
          Website type
        </span>
        <select
          value={form.type}
          onChange={(event) =>
            setForm({
              ...form,
              type: event.target.value as WebsiteSettings["type"],
            })
          }
          className={inputClass}
        >
          <option value="NONE">Not published</option>
          <option value="TEMPLATE">DropXcutz template website</option>
          <option value="CUSTOM">Custom website</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-800">
          Website title
        </span>
        <input
          value={form.title ?? ""}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          maxLength={160}
          placeholder="Velvet Glow Salon & Spa"
          className={inputClass}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-800">Description</span>
        <textarea
          value={form.description ?? ""}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          maxLength={5000}
          rows={5}
          placeholder="Describe your salon, services and location."
          className={inputClass}
        />
      </label>
      {form.type === "CUSTOM" && (
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-800">
            Custom domain
          </span>
          <input
            value={form.customDomain ?? ""}
            onChange={(event) =>
              setForm({ ...form, customDomain: event.target.value })
            }
            maxLength={253}
            placeholder="www.yoursalon.com"
            className={inputClass}
          />
          <span className="text-xs text-zinc-500">
            Connect DNS and use the Integration page to allow this domain.
          </span>
        </label>
      )}
      <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
        <Save className="h-4 w-4" />
        Save website settings
      </button>
    </form>
  );
}

export function Unavailable({ title }: { title: string }) {
  return (
    <div className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-4 text-center">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-950">Feature unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{title}</p>
      </div>
    </div>
  );
}
