const isProduction = process.env.NODE_ENV === "production";

/** Base URL of the DropXcutz API (ends with /api). Server-side may use a private URL via API_URL. */
export const serverApiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? (isProduction ? "" : "http://localhost:5000/api")).replace(/\/$/, "");
export const browserApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? (isProduction ? "" : "http://localhost:5000/api")).replace(/\/$/, "");

export function assertConfigured() {
  if (!serverApiUrl)
    throw new Error("NEXT_PUBLIC_API_URL is not set. Add it in your hosting project's environment variables (e.g. https://api.yourdomain.com/api).");
}
