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
  });

  it("routes STI concern to north park pharmacy", () => {
    const r = routeQuery({
      need_description: "Need STI screening confidentially in Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0].provider_id).toBe("north-park-pharmacy");
    expect(r.matches[0].validation_status).toBe("draft");
  });

  it("routes tooth pain to west dental", () => {
    const r = routeQuery({
      need_description: "Broken tooth, severe dental pain Glasgow emergency",
      location: "Glasgow",
    });
    expect(r.matches[0].provider_id).toBe("west-dental");
  });

  it("routes burnout to deserved massage emotional offer", () => {
    const r = routeQuery({
      need_description: "Burned out, stressed, cannot sleep, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0].offer_id).toBe("deserved-massage-stress-burnout-glasgow");
  });

  it("routes smile confidence to west dental identity offer", () => {
    const r = routeQuery({
      need_description: "Self-conscious about my smile in meetings, Glasgow",
      location: "Glasgow",
    });
    expect(r.matches[0].provider_id).toBe("west-dental");
    expect(r.matches[0].problem_type).toBe("Identity");
  });
});
