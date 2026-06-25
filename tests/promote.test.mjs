import { describe, it, expect } from "vitest";
import { evaluateOfferPromotion, promoteOpportunityMarkdown } from "../src/lib/promote.mjs";

const SAMPLE = `---
tags:
  - #category/opportunity
  - #stage/provisional
validation_status: provisional
economics:
  owner_earnings_positive: true
  cfa_status: true
  resolution_count: 10
  resolution_rate: 0.85
---

## Signal log

\`\`\`
\`\`\`
`;

describe("evaluateOfferPromotion", () => {
  it("passes massage stress offer when Match-tier economics override passes gates", () => {
    const r = evaluateOfferPromotion("deserved-massage-stress-burnout-glasgow", {
      owner_earnings_positive: true,
      cfa_status: true,
      resolution_count: 10,
      resolution_rate: 0.85,
      attribution_tier: "match",
    });
    expect(r.ok).toBe(true);
    expect(r.canPromote).toBe(true);
  });

  it("does not promote from doctrine alone when attribution is unmatched", () => {
    const r = evaluateOfferPromotion("deserved-massage-stress-burnout-glasgow");
    expect(r.ok).toBe(true);
    expect(r.canPromote).toBe(false);
  });
});

describe("promoteOpportunityMarkdown", () => {
  it("updates validation_status and stage tag", () => {
    const r = promoteOpportunityMarkdown(SAMPLE, {
      proposed_status: "validated",
      result: "validated",
    });
    expect(r.promoted).toBe(true);
    expect(r.markdown).toContain("validation_status: validated");
    expect(r.markdown).toContain("#stage/validated");
    expect(r.markdown).not.toContain("#stage/provisional");
  });
});
