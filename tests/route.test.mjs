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

  it("classifies STI but returns no match until pharmacy cell is routing-eligible", () => {
    const r = routeQuery({
      need_description: "Need STI screening confidentially in Glasgow",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBe("sti-screening");
    expect(r.matches.length).toBe(0);
  });

  it("classifies dental emergency but returns no match until west-dental is routing-eligible", () => {
    const r = routeQuery({
      need_description: "Broken tooth, severe dental pain Glasgow emergency",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBe("dental-emergency");
    expect(r.matches.length).toBe(0);
  });

  it("routes burnout to deserved massage emotional offer", () => {
    const r = routeQuery({
      need_description: "Burned out, stressed, cannot sleep, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0].offer_id).toBe("deserved-massage-stress-burnout-glasgow");
  });

  it("classifies smile confidence but returns no match until west-dental is routing-eligible", () => {
    const r = routeQuery({
      need_description: "Self-conscious about my smile in meetings, Glasgow",
      location: "Glasgow",
    });
    expect(r.intake.problem_slug).toBe("smile-confidence");
    expect(r.matches.length).toBe(0);
  });
});
