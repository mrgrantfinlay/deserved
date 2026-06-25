import { describe, expect, it } from "vitest";
import { classifyIntake } from "../src/lib/classify.mjs";

describe("classifyIntake", () => {
  it("classifies back pain as Recovery + Functional", () => {
    const r = classifyIntake({
      need_description: "Chronic lower back pain, can't sleep, need help in Glasgow",
      location: "Glasgow",
    });
    expect(r.ok).toBe(true);
    expect(r.intake.need_type).toBe("Recovery");
    expect(r.intake.problem_type).toBe("Functional");
  });

  it("classifies STI concern as Safety + Systemic", () => {
    const r = classifyIntake({
      need_description: "Worried about STI after unprotected sex, need confidential help Glasgow",
      location: "Glasgow",
    });
    expect(r.intake.need_type).toBe("Safety");
    expect(r.intake.problem_type).toBe("Systemic");
  });

  it("classifies dental emergency as Safety + Functional", () => {
    const r = classifyIntake({
      need_description: "Agonising tooth pain, need emergency dentist Glasgow",
      location: "Glasgow",
    });
    expect(r.intake.need_type).toBe("Safety");
    expect(r.intake.problem_type).toBe("Functional");
  });
});
