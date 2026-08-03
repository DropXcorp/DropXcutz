import type { Request, Response } from "express";
import { created, ok, salonId } from "../../controllers/http.controller";
import {
  branchInput,
  branchListQuery,
  branchPatch,
} from "../../validators/branch.validator";
import { BranchService } from "./branch.service";
const service = new BranchService();
const actorId = (response: Response) => String(response.locals.user.id);
export async function listBranches(request: Request, response: Response) {
  ok(
    response,
    await service.list(salonId(response), branchListQuery.parse(request.query)),
  );
}
export async function getBranch(request: Request, response: Response) {
  ok(response, await service.get(salonId(response), String(request.params.id)));
}
export async function createBranch(request: Request, response: Response) {
  created(
    response,
    await service.create(
      salonId(response),
      actorId(response),
      branchInput.parse(request.body),
    ),
  );
}
export async function updateBranch(request: Request, response: Response) {
  ok(
    response,
    await service.update(
      salonId(response),
      actorId(response),
      String(request.params.id),
      branchPatch.parse(request.body),
    ),
  );
}
export async function activateBranch(request: Request, response: Response) {
  ok(
    response,
    await service.setActive(
      salonId(response),
      actorId(response),
      String(request.params.id),
      true,
    ),
  );
}
export async function deactivateBranch(request: Request, response: Response) {
  ok(
    response,
    await service.setActive(
      salonId(response),
      actorId(response),
      String(request.params.id),
      false,
    ),
  );
}
export async function deleteBranch(request: Request, response: Response) {
  await service.delete(
    salonId(response),
    actorId(response),
    String(request.params.id),
  );
  response.status(204).end();
}
