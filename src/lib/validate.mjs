import { getOfferById } from "./catalog.mjs";

const GATES = {
  owner_earnings_positive: {
    label: "owner_earnings_positive",
    source: "03-Investing/05-ACCOUNTING-AND-VALUATION.md",
    check: (e) => e?.owner_earnings_positive === true,
  },
  cfa_status: {
    label: "cfa_status",
    source: "01-Business/01-Foundation/04-GYM-SCALING.md",
    check: (e) => e?.cfa_status === true,
  },
  resolution_rate: {
    label: "resolution_rate ≥ 0.70",
    source: "DESERVED-ONTOLOGY.md ValidateOffer",
    check: (_, o) => (o?.resolutionRate ?? 0) >= 0.7,
  },
  resolution_count_validated: {
    label: "resolution_count ≥ 5",
    source: "04-Opportunities/README.md",
    check: (e) => (e?.resolution_count ?? 0) >= 5,
  },
  trust_score_certified: {
    label: "trust_score ≥ 0.80 (certified)",
    source: "04-Opportunities/README.md",
    check: (_, o, target) =>
      target !== "certified" || (o?.trustScore ?? 0) >= 0.8,
  },
};

/**
 * ValidateOffer — economics from opportunity frontmatter when present on offer extras.
 * Phase 1: gates read from JSON-LD fields + optional body.economics override.
 */
export function validateOffer(input) {
  const offerId = input.offer_id ?? input.provider_id;
  if (!offerId) {
    return { ok: false, error: "offer_id or provider_id is required" };
  }

  const offer = getOfferById(offerId);
  if (!offer) {
    return { ok: false, error: `Unknown offer: ${offerId}` };
  }

  const economics = {
    owner_earnings_positive:
      input.economics?.owner_earnings_positive ?? offer.economics?.owner_earnings_positive ?? false,
    cfa_status: input.economics?.cfa_status ?? offer.economics?.cfa_status ?? false,
    resolution_count:
      input.economics?.resolution_count ?? offer.economics?.resolution_count ?? 0,
    resolution_rate:
      input.economics?.resolution_rate ?? offer.economics?.resolution_rate ?? offer.resolutionRate ?? 0,
  };

  const targetStatus = input.target_status ?? "validated";
  const gates_passed = [];
  const gates_failed = [];

  for (const gate of Object.values(GATES)) {
    const pass = gate.check(economics, offer, targetStatus);
    if (pass) gates_passed.push(gate.label);
    else gates_failed.push(gate.label);
  }

  const provisionalOk =
    gates_failed.filter((g) => !g.includes("certified")).length === 0;
  const validatedOk = gates_failed.length === 0;

  let result = "rejected";
  let validation_status = offer.validationStatus;

  if (validatedOk && targetStatus === "certified") {
    result = "validated";
    validation_status = "certified";
  } else if (validatedOk || (provisionalOk && targetStatus === "validated")) {
    result = validatedOk ? "validated" : "provisional";
    validation_status = validatedOk ? "validated" : "provisional";
  } else if (provisionalOk) {
    result = "provisional";
    validation_status = "provisional";
  }

  return {
    ok: true,
    validation: {
      id: `val_${crypto.randomUUID().slice(0, 12)}`,
      provider_id: offer.providerId,
      offer_id: offer.id,
      doctrine_path: offer.doctrinePath,
      validated_at: new Date().toISOString(),
      gates_passed,
      gates_failed,
      owner_earnings: input.economics?.owner_earnings ?? null,
      cfa_ratio: input.economics?.cfa_ratio ?? null,
      resolution_rate: economics.resolution_rate,
      resolution_count: economics.resolution_count,
      result,
      validation_status,
    },
    offer: {
      id: offer.id,
      provider_id: offer.providerId,
      dream_outcome: offer.dreamOutcome,
      current_status: offer.validationStatus,
      proposed_status: validation_status,
    },
  };
}
