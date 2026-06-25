import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("sync-doctrine", () => {
  it("catalog includes doctrine economics from 04-Opportunities", () => {
    const catalogPath = path.join(ROOT, "src/generated/catalog.mjs");
    const src = readFileSync(catalogPath, "utf8");
    expect(src).toContain("deserved-massage-back-pain-glasgow");
    expect(src).toContain("deserved-massage-stress-burnout-glasgow");
    expect(src).toContain("west-dental-smile-confidence-glasgow");
    expect(src).toContain("owner_earnings_positive");
    expect(src).toContain("doctrinePath");
  });
});
