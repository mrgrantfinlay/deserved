import { describe, expect, it } from "vitest";
import { validateOffer } from "../src/lib/validate.mjs";

describe("validateOffer", () => {
  it("keeps massage offer provisional until Match-tier resolution economics", () => {
    const r = validateOffer({
      offer_id: "deserved-massage-back-pain-glasgow",
      target_status: "validated",
    });
    expect(r.ok).toBe(true);
    expect(r.validation.gates_passed).toContain("owner_earnings_positive");
    expect(r.validation.gates_failed).toContain("attribution_tier = match");
    expect(r.validation.validation_status).toBe("provisional");
  });

  it("validates when Match-tier economics override passes all gates", () => {
    const r = validateOffer({
      offer_id: "deserved-massage-back-pain-glasgow",
      target_status: "validated",
      economics: {
        owner_earnings_positive: true,
        cfa_status: true,
        resolution_count: 10,
        resolution_rate: 0.85,
        attribution_tier: "match",
      },
    });
    expect(r.ok).toBe(true);
    expect(r.validation.validation_status).toBe("validated");
  });

  it("rejects draft pharmacy until economics pass", () => {
    const r = validateOffer({
      offer_id: "north-park-pharmacy-sti-screening-glasgow",
      target_status: "validated",
    });
    expect(r.ok).toBe(true);
    expect(r.validation.gates_failed.length).toBeGreaterThan(0);
    expect(r.validation.result).toBe("rejected");
  });

  it("resolves by provider_id alias", () => {
    const r = validateOffer({ offer_id: "deserved-massage" });
    expect(r.ok).toBe(true);
    expect(r.offer.provider_id).toBe("deserved-massage");
  });
});
