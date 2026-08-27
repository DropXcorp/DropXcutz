import { z } from "zod";

export const integrationCreateInput = z.object({ allowedDomains: z.array(z.string().trim().min(1).max(253)).max(100).default([]) });
export const integrationPatchInput = z.object({ allowedDomains: z.array(z.string().trim().min(1).max(253)).max(100).optional(), isActive: z.boolean().optional() }).refine((value) => value.allowedDomains !== undefined || value.isActive !== undefined, "At least one field is required.");
