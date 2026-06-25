import { describe, expect, it } from "vitest";
import { routeQuery } from "../src/lib/route.mjs";

describe("routeQuery", () => {
  it("routes Glasgow back pain to deserved massage", () => {
    const r = routeQuery({
      need_description: "Lower back pain stopping me sleeping, Glasgow",
      location: "Glasgow",
      routing_source: "llm",
    });
    expect(r.ok).toBe(true);
    expect(r.matches.length).toBe(1);
    expect(r.matches[0].provider_id).toBe("deserved-massage");
    expect(r.matches[0].offer_id).toBe("deserved-massage-back-pain-glasgow");
    expect(r.intake.problem_slug).toBe("back-pain");
  });

  it("returns no match for out-of-scope dental intake", () => {
    const r = routeQuery({
      need_description: "Broken tooth, severe dental pain Glasgow emergency",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBeFalsy();
    expect(r.matches.length).toBe(0);
    expect(r.meta.routing_friction).toBeUndefined();
  });

  it("routes burnout to deserved massage emotional offer", () => {
    const r = routeQuery({
      need_description: "Burned out, stressed, cannot sleep, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0].offer_id).toBe("deserved-massage-stress-burnout-glasgow");
  });

  it("routes pregnancy comfort to massage offer", () => {
    const r = routeQuery({
      need_description: "Pregnant, second trimester, need gentle massage Glasgow",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBe("pregnancy-comfort");
    expect(r.matches[0].offer_id).toBe("deserved-massage-pregnancy-glasgow");
  });
});
