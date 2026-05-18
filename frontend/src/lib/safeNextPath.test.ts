// TKT-0039: starter Vitest suite. Covers the same 9 cases the iter75
// Verification Agent ran via inline node. Formalized here so CI can
// guard against open-redirect regressions.

import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safeNextPath";

describe("safeNextPath", () => {
  it.each<[string | null | undefined, string]>([
    [null, "/dashboard"],
    [undefined, "/dashboard"],
    ["", "/dashboard"],
    ["/dashboard", "/dashboard"],
    ["/connect", "/connect"],
    ["//evil.com", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
    ["http://evil.com", "/dashboard"],
    ["/a:b", "/dashboard"],
  ])("safeNextPath(%j) === %j", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
