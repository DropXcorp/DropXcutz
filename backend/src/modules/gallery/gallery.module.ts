import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";


const input = z.object({
  imageUrl: z.string().url().max(2000),
  title: z.string().trim().max(160).optional().nullable(),
  order: z.coerce.number().int().min(0).optional(),
});


export const galleryRouter = Router();
async function get(s: string, id: string) {
  const x = await prisma.galleryImage.findFirst({ where: { id, salonId: s } });
  if (!x) throw new ApiError(404, "Gallery image not found.");
  return x;
}


galleryRouter.get("/", async (_q, res) =>
  ok(
    res,
    await prisma.galleryImage.findMany({
      where: { salonId: salonId(res) },
      orderBy: { order: "asc" },
    }),
  ),
);


galleryRouter.post("/", requireSalonAdmin, async (req, res) => {
  const v = input.parse(req.body);
  const order =
    v.order ??
    (await prisma.galleryImage.count({ where: { salonId: salonId(res) } }));
  created(
    res,
    await prisma.galleryImage.create({
      data: { ...v, order, salonId: salonId(res), title: v.title || null },
    }),
  );
});


galleryRouter.patch("/:id", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  ok(
    res,
    await prisma.galleryImage.update({
      where: { id: String(req.params.id) },
      data: input.partial().parse(req.body),
    }),
  );
});


galleryRouter.delete("/:id", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  await prisma.galleryImage.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
});
