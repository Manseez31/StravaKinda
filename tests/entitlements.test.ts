import { expect, it } from "vitest";
import { hasPremium } from "../utils/entitlements";
it("fails closed for missing, inactive, expired or invalid entitlement", () => {
  expect(hasPremium(undefined)).toBe(false);
  expect(hasPremium({ isActive: false })).toBe(false);
  expect(hasPremium({ isActive: true, expirationDate: "invalid" })).toBe(false);
  expect(hasPremium({ isActive: true, expirationDate: "2020-01-01" })).toBe(
    false,
  );
});
it("accepts active unexpired and lifetime entitlements", () => {
  expect(
    hasPremium({ isActive: true, expirationDate: "2030-01-01" }, 1000),
  ).toBe(true);
  expect(hasPremium({ isActive: true, expirationDate: null })).toBe(true);
});
