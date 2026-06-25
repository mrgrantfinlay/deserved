import { describe, expect, it } from "vitest";
import { validateOffer } from "../src/lib/validate.mjs";

describe("validateOffer", () => {
  it("validates deserved-massage from doctrine economics", () => {
    const r = validateOffer({
      offer_id: "deserved-massage-back-pain-glasgow",
      target_status: "validated",
    });
    expect(r.ok).toBe(true);
    expect(r.validation.gates_passed).toContain("owner_earnings_positive");
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
