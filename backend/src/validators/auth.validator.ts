import { z } from "zod";

const email = z.string().trim().email().max(200).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(200);

export const loginInput = z.object({ email, password: z.string().min(1).max(200) });
export const passwordChangeInput = z.object({ currentPassword: z.string().min(1).max(200), newPassword: password });
