import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/error.middleware";
import { created, salonId } from "./http.controller";

const input = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ]),
  data: z.string().min(1),
});
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};
const root = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
export async function uploadFile(request: Request, response: Response) {
  const value = input.parse(request.body);
  const buffer = Buffer.from(
    value.data.replace(/^data:[^;]+;base64,/, ""),
    "base64",
  );
  if (!buffer.length || buffer.length > 5 * 1024 * 1024)
    throw new ApiError(400, "Files must be between 1 byte and 5 MB.");
  const tenant = salonId(response);
  const folder = path.join(root, tenant);
  await mkdir(folder, { recursive: true });
  const file = `${randomUUID()}.${extensions[value.contentType]}`;
  await writeFile(path.join(folder, file), buffer, { flag: "wx" });
  created(response, {
    fileName: value.fileName,
    contentType: value.contentType,
    size: buffer.length,
    url: `/uploads/${tenant}/${file}`,
  });
}
