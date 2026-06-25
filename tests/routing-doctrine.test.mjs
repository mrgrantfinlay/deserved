import { describe, it, expect } from "vitest";
import { resolveProblemSlug, disambiguateOffers } from "../src/lib/routing.mjs";
import { routeQuery } from "../src/lib/route.mjs";

describe("resolveProblemSlug", () => {
  it("maps dental emergency phrases", () => {
    expect(resolveProblemSlug("Broken tooth, severe dental pain Glasgow")).toBe("dental-emergency");
  });

  it("maps sti phrases", () => {
    expect(resolveProblemSlug("Need STI screening confidentially")).toBe("sti-screening");
  });
});

describe("routeQuery with doctrine routing", () => {
  it("returns no match when problem_slug has no routing-eligible offer", () => {
    const r = routeQuery({
      need_description: "Broken tooth, severe dental pain Glasgow emergency",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBe("dental-emergency");
    expect(r.matches.length).toBe(0);
  });

  it("excludes routing-ineligible stubs from sti query", () => {
    const r = routeQuery({
      need_description: "Need STI screening confidentially in Glasgow",
      location: "Glasgow",
    });
    expect(r.matches.length).toBe(0);
  });

  it("does not classify stiffness as sti-screening", () => {
    expect(resolveProblemSlug("ease shoulder stiffness")).not.toBe("sti-screening");
    expect(resolveProblemSlug("release tension in my shoulders")).toBe("back-pain");
  });

  it("maps neck pain intake to back-pain slug", () => {
    expect(resolveProblemSlug("Neck pain and tight shoulders Glasgow")).toBe("back-pain");
  });

  it("routes neck pain to massage offer", () => {
    const r = routeQuery({
      need_description: "Neck pain and tight shoulders, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0]?.offer_id).toBe("deserved-massage-back-pain-glasgow");
    expect(r.intake.problem_slug).toBe("back-pain");
  });

  it("routes back pain to massage offer", () => {
    const r = routeQuery({
      need_description: "Lower back pain stopping me sleeping, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0]?.offer_id).toBe("deserved-massage-back-pain-glasgow");
    expect(r.intake.problem_slug).toBe("back-pain");
    expect(r.meta.routing_friction).toBeUndefined();
    expect(r.meta.capability_ids).toContain("deep-tissue-massage");
  });

  it("includes routing_friction meta when slug resolves but no eligible offer", () => {
    const r = routeQuery({
      need_description: "Broken tooth, severe dental pain Glasgow emergency",
      location: "Glasgow",
    });
    expect(r.matches.length).toBe(0);
    expect(r.meta.routing_friction?.reason).toBe("no_routing_eligible_offer");
    expect(r.meta.routing_friction?.default_offer_id).toBe("west-dental-emergency-pain-glasgow");
    expect(r.meta.routing_friction?.suggested_signal?.type).toBe("routing_friction");
    expect(r.meta.providers_with_capability).toContain("west-dental");
  });
});
