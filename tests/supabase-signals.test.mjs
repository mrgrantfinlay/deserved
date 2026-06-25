import { describe, it, expect } from "vitest";
import { supabaseRowToSignal } from "../src/lib/supabase-signals.mjs";

describe("supabaseRowToSignal", () => {
  it("maps runtime_signals row to librarian signal shape", () => {
    const signal = supabaseRowToSignal({
      id: "550e8400-e29b-41d4-a716-446655440000",
      signal_type: "booking",
      confidence: "0.85",
      portable: false,
      note: "Acuity booking: Swedish",
      created_at: "2026-06-25T12:00:00.000Z",
      resolution: null,
    });
    expect(signal).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "booking",
      confidence: 0.85,
      portable: false,
      note: "Acuity booking: Swedish",
      created_at: "2026-06-25T12:00:00.000Z",
      resolution: null,
    });
  });
});
