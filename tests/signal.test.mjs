import { describe, expect, it, beforeEach } from "vitest";
import { recordSignal, listSignals, clearMemorySignals, aggregateResolutionRate } from "../src/lib/signal.mjs";

describe("recordSignal", () => {
  beforeEach(() => clearMemorySignals());

  it("records outcome and computes rolling resolution rate", async () => {
    const r1 = await recordSignal({
      offer_id: "deserved-massage-back-pain-glasgow",
      type: "outcome",
      resolution: { resolved: true, satisfaction_score: 9 },
      note: "Client mobile next day",
    });
    expect(r1.ok).toBe(true);
    expect(r1.observation).toBeTruthy();
    expect(r1.offer.runtime_resolution_rate).toBe(1);

    const r2 = await recordSignal({
      offer_id: "deserved-massage-back-pain-glasgow",
      type: "outcome",
      resolution: { resolved: false },
    });
    expect(r2.offer.runtime_resolution_rate).toBe(0.5);
  });

  it("disambiguates provider with problem_type", async () => {
    const r = await recordSignal({
      provider_id: "deserved-massage",
      problem_type: "Emotional",
      type: "outcome",
      resolution: { resolved: true },
    });
    expect(r.offer.id).toBe("deserved-massage-stress-burnout-glasgow");
  });

  it("lists signals by provider across offers", async () => {
    await recordSignal({
      offer_id: "deserved-massage-back-pain-glasgow",
      type: "outcome",
      resolution: { resolved: true },
    });
    const list = await listSignals("deserved-massage", {});
    expect(list.ok).toBe(true);
    expect(list.offers.length).toBeGreaterThanOrEqual(2);
    expect(list.signal_count).toBe(1);
  });

  it("accepts routing_friction portable signal", async () => {
    const r = await recordSignal({
      offer_id: "west-dental-emergency-pain-glasgow",
      type: "routing_friction",
      portable: true,
      confidence: 0.7,
      note: "problem_slug=dental-emergency; reason=no_routing_eligible_offer",
      resolution: {
        problem_slug: "dental-emergency",
        reason: "no_routing_eligible_offer",
        capability_ids: ["emergency-dental-assessment"],
        providers_with_capability: ["west-dental"],
      },
    });
    expect(r.ok).toBe(true);
    expect(r.signal.type).toBe("routing_friction");
    expect(r.signal.portable).toBe(true);
  });
});

describe("aggregateResolutionRate", () => {
  it("returns null without outcomes", () => {
    expect(aggregateResolutionRate([{ type: "friction" }])).toBeNull();
  });
});
