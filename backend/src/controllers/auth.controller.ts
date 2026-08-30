import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { salonId, ok } from "./http.controller";
import { loginInput, passwordChangeInput } from "../validators/auth.validator";

const cookieName = "dropxcutz_session";
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new ApiError(
      503,
      "JWT_SECRET must be configured with at least 32 characters.",
    );
  return secret;
};

const parseCookie = (request: Request, name: string) =>
  request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
const cookie = (token: string, maxAge: number) => {
  const sameSite = (process.env.COOKIE_SAME_SITE ?? "Lax").toLowerCase();
  if (!["lax", "strict", "none"].includes(sameSite))
    throw new ApiError(503, "COOKIE_SAME_SITE must be Lax, Strict, or None.");
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production" ||
    sameSite === "none";
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return `${cookieName}=${token}; HttpOnly; SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}; Path=/; Max-Age=${maxAge}${secure ? "; Secure" : ""}${domain ? `; Domain=${domain}` : ""}`;
};

export async function login(request: Request, response: Response) {
  const { email, password } = loginInput.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { salon: true },
  });
  if (
    !user ||
    !user.active ||
    (user.salon &&
      (user.salon.status === "SUSPENDED" ||
        user.salon.status === "ARCHIVED")) ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    throw new ApiError(401, "Invalid email or password.");
  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: "platform" },
    select: { sessionHours: true },
  });
  const sessionHours = Math.min(Math.max(platformSettings?.sessionHours ?? 8, 1), 720);
  const sessionSeconds = sessionHours * 60 * 60;
  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionSeconds * 1000);
  const token = jwt.sign(
    { sub: user.id, sid: sessionId, role: user.role },
    jwtSecret(),
    { expiresIn: sessionSeconds },
  );
  await prisma.session.create({
    data: { userId: user.id, tokenHash: tokenHash(sessionId), expiresAt },
  });
  void prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  response.setHeader("Set-Cookie", cookie(token, sessionSeconds));
  ok(response, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    salon: user.salon
      ? { id: user.salon.id, code: user.salon.code, name: user.salon.salonName }
      : null,
  });
}

export async function logout(request: Request, response: Response) {
  const token = parseCookie(request, cookieName);
  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret()) as { sid?: string };
      if (payload.sid)
        await prisma.session.deleteMany({
          where: { tokenHash: tokenHash(payload.sid) },
        });
    } catch {}
  }
  response.setHeader("Set-Cookie", cookie("", 0));
  response.status(204).end();
}

export async function me(_request: Request, response: Response) {
  const user = response.locals.user;
  ok(response, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    salon: user.salon
      ? { id: user.salon.id, code: user.salon.code, name: user.salon.salonName }
      : null,
  });
}

export async function changePassword(request: Request, response: Response) {
  const user = response.locals.user;
  const { currentPassword, newPassword } = passwordChangeInput.parse(
    request.body,
  );
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new ApiError(401, "Current password is incorrect.");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      mustChangePassword: false,
    },
  });
  await prisma.session.deleteMany({
    where: { userId: user.id, id: { not: response.locals.session.id } },
  });
  response.status(204).end();
}
