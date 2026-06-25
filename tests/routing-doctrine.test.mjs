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

  it("routes back pain to massage offer", () => {
    const r = routeQuery({
      need_description: "Lower back pain stopping me sleeping, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0]?.offer_id).toBe("deserved-massage-back-pain-glasgow");
    expect(r.intake.problem_slug).toBe("back-pain");
  });
});
