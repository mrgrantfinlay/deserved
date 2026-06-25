import { describe, it, expect } from "vitest";
import {
  formatSignalLine,
  appendSignalLogLines,
  pickUnsyncedSignals,
  patchOpportunityMarkdown,
} from "../src/lib/librarian.mjs";

const SAMPLE = `---
provider_id: test
economics:
  resolution_rate: 0.5
  resolution_count: 2
---

# Test

## Signal log

\`\`\`
2026-06-25 | outcome | 0.84 | false | Existing line
\`\`\`
`;

describe("formatSignalLine", () => {
  it("matches schema pipe format", () => {
    const line = formatSignalLine({
      id: "sig_1",
      type: "booking",
      confidence: 0.85,
      portable: false,
      note: "Acuity booking: Swedish",
      created_at: "2026-06-25T12:00:00.000Z",
    });
    expect(line).toBe("2026-06-25 | booking | 0.85 | false | Acuity booking: Swedish");
  });
});

describe("patchOpportunityMarkdown", () => {
  it("appends only new signal ids", () => {
    const signals = [
      {
        id: "sig_a",
        type: "booking",
        confidence: 0.85,
        portable: false,
        note: "New booking",
        created_at: "2026-06-26T10:00:00.000Z",
      },
    ];
    const r = patchOpportunityMarkdown(SAMPLE, signals, []);
    expect(r.ok).toBe(true);
    expect(r.appended).toBe(1);
    expect(r.markdown).toContain("2026-06-26 | booking | 0.85 | false | New booking");
    expect(r.markdown).toContain("Existing line");

    const r2 = patchOpportunityMarkdown(r.markdown, signals, ["sig_a"]);
    expect(r2.appended).toBe(0);
  });

  it("updates economics from outcomes", () => {
    const base = SAMPLE.replace("resolution_count: 2", "resolution_count: 0");
    const signals = [
      {
        id: "sig_o1",
        type: "outcome",
        confidence: 0.65,
        portable: true,
        resolution: { resolved: true },
        created_at: "2026-06-26T11:00:00.000Z",
      },
    ];
    const r = patchOpportunityMarkdown(base, signals, []);
    expect(r.markdown).toMatch(/resolution_rate:\s*1/);
    expect(r.markdown).toMatch(/resolution_count:\s*1/);
  });

  it("preserves hash-tags and comments in frontmatter", () => {
    const tagged = `---
tags:
  - #category/opportunity
  - #stage/provisional
provider_id: test
trust_score: 0.82                         # estimated
economics:
  resolution_rate: 0.5
  resolution_count: 0
last_validated: 2026-01-01
---

## Signal log

\`\`\`
\`\`\`
`;
    const r = patchOpportunityMarkdown(tagged, [
      {
        id: "sig_x",
        type: "booking",
        confidence: 0.8,
        portable: false,
        note: "Kept tags",
        created_at: "2026-06-26T12:00:00.000Z",
      },
    ], []);
    expect(r.markdown).toContain("#category/opportunity");
    expect(r.markdown).toContain("#stage/provisional");
    expect(r.markdown).toContain("# estimated");
    expect(r.markdown).not.toContain("null");
  });
});

describe("appendSignalLogLines", () => {
  it("returns error when section missing", () => {
    const r = appendSignalLogLines("# No log\n", ["line"]);
    expect(r.appended).toBe(0);
    expect(r.error).toBe("missing_signal_log");
  });
});

describe("pickUnsyncedSignals", () => {
  it("filters by id", () => {
    const pending = pickUnsyncedSignals(
      [{ id: "a" }, { id: "b" }],
      ["a"],
    );
    expect(pending.map((s) => s.id)).toEqual(["b"]);
  });
});
