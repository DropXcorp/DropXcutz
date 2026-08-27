import { describe, expect, test } from "bun:test";
import {
  loginInput,
  passwordChangeInput,
} from "../src/validators/auth.validator";
import {
  integrationCreateInput,
  integrationPatchInput,
} from "../src/validators/integration.validator";
import { loyaltyAdjustmentInput } from "../src/validators/loyalty.validator";
import { planInput, subscriptionInput } from "../src/validators/plan.validator";

describe("request validation", () => {
  test("normalizes login email and rejects empty credentials", () => {
    expect(
      loginInput.parse({ email: " ADMIN@EXAMPLE.COM ", password: "secret" })
        .email,
    ).toBe("admin@example.com");
    expect(() => loginInput.parse({ email: "bad", password: "" })).toThrow();
  });
  test("requires a strong password change", () => {
    expect(() =>
      passwordChangeInput.parse({
        currentPassword: "old",
        newPassword: "short",
      }),
    ).toThrow();
  });
  test("requires valid integration updates", () => {
    expect(integrationCreateInput.parse({}).allowedDomains).toEqual([]);
    expect(() => integrationPatchInput.parse({})).toThrow();
  });
  test("bounds loyalty adjustments", () => {
    expect(() => loyaltyAdjustmentInput.parse({ points: 0 })).toThrow();
    expect(() => loyaltyAdjustmentInput.parse({ points: 100001 })).toThrow();
  });
  test("validates plans and subscriptions", () => {
    expect(planInput.parse({ code: "STARTER", name: "Starter" }).code).toBe(
      "STARTER",
    );
    expect(() =>
      subscriptionInput.parse({ planId: "", status: "ACTIVE" }),
    ).toThrow();
  });
});
