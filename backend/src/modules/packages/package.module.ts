import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import {
  packageInput,
  packageServiceInput,
} from "../../validators/package.validator";


const dto = (x: any) => ({
  ...x,
  price: Number(x.price),
  packageServices: x.packageServices?.map((p: any) => ({
    serviceId: p.serviceId,
    quantity: p.quantity,
  })),
});


const user = (r: Response) => String(r.locals.user.id);
export const packageRouter = Router();
packageRouter.use(requireFeature("CUSTOM_ERP"));
async function get(salon: string, id: string) {
  const item = await prisma.package.findFirst({
    where: { id, salonId: salon },
    include: { packageServices: true },
  });
  if (!item) throw new ApiError(404, "Package not found.");
  return item;
}


packageRouter.get("/", async (_q, res) =>
  ok(
    res,
    (
      await prisma.package.findMany({
        where: { salonId: salonId(res) },
        include: { packageServices: true },
      })
    ).map(dto),
  ),
);


packageRouter.get("/:id", async (req, res) =>
  ok(res, dto(await get(salonId(res), String(req.params.id)))),
);


packageRouter.post(
  "/",
  requireSalonAdmin,
  async (req: Request, res: Response) => {
    const input = packageInput.parse(req.body);
    const item = await prisma.$transaction(async (c) => {
      const x = await c.package.create({
        data: {
          ...input,
          salonId: salonId(res),
          description: input.description || null,
        },
        include: { packageServices: true },
      });
      await c.salonAuditLog.create({
        data: {
          salonId: salonId(res),
          userId: user(res),
          action: "CREATE",
          entity: "Package",
          entityId: x.id,
          newValue: dto(x),
        },
      });
      return x;
    });
    created(res, dto(item));
  },
);


packageRouter.patch("/:id", requireSalonAdmin, async (req, res) => {
  const input = packageInput.partial().parse(req.body);
  await get(salonId(res), String(req.params.id));
  ok(
    res,
    dto(
      await prisma.package.update({
        where: { id: String(req.params.id) },
        data: {
          ...input,
          description:
            input.description === undefined
              ? undefined
              : input.description || null,
        },
        include: { packageServices: true },
      }),
    ),
  );
});

packageRouter.delete("/:id", requireSalonAdmin, async (req, res) => {
  const id = String(req.params.id);
  await get(salonId(res), id);
  await prisma.package.delete({ where: { id } });
  res.status(204).end();
});


packageRouter.post("/:id/services", requireSalonAdmin, async (req, res) => {
  const input = packageServiceInput.parse(req.body);
  await get(salonId(res), String(req.params.id));
  if (
    !(await prisma.service.findFirst({
      where: { id: input.serviceId, salonId: salonId(res) },
    }))
  )
    throw new ApiError(404, "Service not found.");
  ok(
    res,
    await prisma.packageService.upsert({
      where: {
        packageId_serviceId: {
          packageId: String(req.params.id),
          serviceId: input.serviceId,
        },
      },
      create: { packageId: String(req.params.id), ...input },
      update: { quantity: input.quantity },
    }),
  );
});


packageRouter.delete(
  "/:id/services/:serviceId",
  requireSalonAdmin,
  async (req, res) => {
    await get(salonId(res), String(req.params.id));
    await prisma.packageService.delete({
      where: {
        packageId_serviceId: {
          packageId: String(req.params.id),
          serviceId: String(req.params.serviceId),
        },
      },
    });
    res.status(204).end();
  },
);
