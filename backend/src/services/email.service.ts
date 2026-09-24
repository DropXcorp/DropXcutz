import nodemailer from "nodemailer";
import { ApiError } from "../middleware/error.middleware";

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

const transport = () => {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    throw new ApiError(503, "Email is not configured.");
  }
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
};

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  await transport().sendMail({ from, to: input.to, subject: input.subject, html: input.html });
}
