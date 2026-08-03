import type { Request, Response } from "express";
import { created, ok, salonId } from "../../controllers/http.controller";
import {
  serviceCategoryInput,
  serviceCategoryPatch,
  serviceCategoryQuery,
} from "../../validators/service-category.validator";
import { ServiceCategoryService } from "./service-category.service";
const service = new ServiceCategoryService();
const userId = (response: Response) => String(response.locals.user.id);
export async function listServiceCategories(
  request: Request,
  response: Response,
) {
  ok(
    response,
    await service.list(
      salonId(response),
      serviceCategoryQuery.parse(request.query),
    ),
  );
}


export async function getServiceCategory(request: Request, response: Response) {
  ok(response, await service.get(salonId(response), String(request.params.id)));
}


export async function listCategoryServices(
  request: Request,
  response: Response,
) {
  ok(
    response,
    await service.services(salonId(response), String(request.params.id)),
  );
}


export async function createServiceCategory(
  request: Request,
  response: Response,
) {
  created(
    response,
    await service.create(
      salonId(response),
      userId(response),
      serviceCategoryInput.parse(request.body),
    ),
  );
}


export async function updateServiceCategory(
  request: Request,
  response: Response,
) {
  ok(
    response,
    await service.update(
      salonId(response),
      userId(response),
      String(request.params.id),
      serviceCategoryPatch.parse(request.body),
    ),
  );
}


export async function deleteServiceCategory(
  request: Request,
  response: Response,
) {
  await service.delete(
    salonId(response),
    userId(response),
    String(request.params.id),
  );
  response.status(204).end();
}
