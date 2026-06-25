import { describe, it, expect } from "vitest";
import { resolveProblemSlug, buildRoutingFriction } from "../src/lib/routing.mjs";
import { routeQuery } from "../src/lib/route.mjs";

describe("resolveProblemSlug", () => {
  it("does not map dental phrases to a portfolio slug", () => {
    expect(resolveProblemSlug("Broken tooth, severe dental pain Glasgow")).toBeFalsy();
  });

  it("maps pregnancy phrases", () => {
    expect(resolveProblemSlug("Pregnant, second trimester massage")).toBe("pregnancy-comfort");
  });
});

describe("buildRoutingFriction", () => {
  it("builds portable signal meta for a known problem slug", () => {
    const friction = buildRoutingFriction("back-pain");
    expect(friction?.reason).toBe("no_routing_eligible_offer");
    expect(friction?.default_offer_id).toBe("deserved-massage-back-pain-glasgow");
    expect(friction?.suggested_signal?.type).toBe("routing_friction");
    expect(friction?.providers_with_capability).toContain("deserved-massage");
  });
});

describe("routeQuery with doctrine routing", () => {
  it("returns no match for out-of-scope dental intake", () => {
    const r = routeQuery({
      need_description: "Broken tooth, severe dental pain Glasgow emergency",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBeFalsy();
    expect(r.matches.length).toBe(0);
    expect(r.meta.routing_friction).toBeUndefined();
  });

  it("does not classify stiffness as a removed pharmacy slug", () => {
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

  it("routes back pain to massage offer without routing friction", () => {
    const r = routeQuery({
      need_description: "Lower back pain stopping me sleeping, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0]?.offer_id).toBe("deserved-massage-back-pain-glasgow");
    expect(r.intake.problem_slug).toBe("back-pain");
    expect(r.meta.routing_friction).toBeUndefined();
    expect(r.meta.capability_ids).toContain("deep-tissue-massage");
  });
});
