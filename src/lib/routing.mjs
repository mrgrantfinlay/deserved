/**
 * Doctrine routing index — compiled from knowledge/04-Opportunities/_routing/
 */
import {
  PROBLEMS,
  NEEDS,
  MARKETS,
  CLASSIFIER,
} from "../generated/routing-index.mjs";
import { CAPABILITIES } from "../generated/capabilities.mjs";

function termInText(text, term) {
  const t = String(term).toLowerCase();
  if (!t) return false;
  if (t.length <= 4 || ["pain", "back", "neck", "hip"].includes(t)) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  }
  return text.includes(t);
}

function scorePhrases(text, phrases = [], exclude = []) {
  const lower = String(text).toLowerCase();
  for (const ex of exclude) {
    if (termInText(lower, ex)) return -1;
  }
  let score = 0;
  for (const p of phrases) {
    if (termInText(lower, p)) score += 1;
  }
  return score;
}

/**
 * Match intake text to problem_slug using portfolio problems.yaml phrases.
 */
export function resolveProblemSlug(description) {
  const text = String(description || "");
  let best = null;
  let bestScore = 0;

  for (const [slug, problem] of Object.entries(PROBLEMS)) {
    const score = scorePhrases(text, problem.phrases, problem.exclude_phrases);
    if (score > bestScore) {
      bestScore = score;
      best = slug;
    }
  }

  return bestScore > 0 ? best : null;
}

export function problemBySlug(slug) {
  return PROBLEMS[slug] ?? null;
}

/**
 * Classify need/problem from doctrine needs.yaml phrase scores, with problem_slug override.
 */
export function classifyFromDoctrine(description) {
  const text = String(description || "");
  const needScores = {};
  for (const [needType, cfg] of Object.entries(NEEDS.need_types ?? {})) {
    needScores[needType] = scorePhrases(text, cfg.intake_phrases ?? []);
  }

  const problemSlug = resolveProblemSlug(text);
  if (problemSlug && PROBLEMS[problemSlug]) {
    const p = PROBLEMS[problemSlug];
    return {
      need_type: p.need_type,
      problem_type: p.problem_type,
      problem_slug: problemSlug,
      classifier: "doctrine-routing-v1",
    };
  }

  const need_type = Object.entries(needScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Recovery";
  const problem_type = "Functional";
  return {
    need_type,
    problem_type,
    problem_slug: null,
    classifier: "doctrine-routing-v1-fallback",
  };
}

export function disambiguateOffers(description, candidates) {
  if (!candidates?.length) return candidates;
  const text = String(description || "");
  const slug = resolveProblemSlug(text);

  if (slug) {
    const bySlug = candidates.filter((o) => o.problemSlug === slug);
    if (bySlug.length) return bySlug;
  }

  const scored = candidates.map((offer) => {
    const problem = offer.problemSlug ? PROBLEMS[offer.problemSlug] : null;
    const phraseScore = problem ? scorePhrases(text, problem.phrases, problem.exclude_phrases) : 0;
    return { offer, phraseScore };
  });
  scored.sort((a, b) => b.phraseScore - a.phraseScore);
  const top = scored[0]?.phraseScore ?? 0;
  if (top > 0) {
    return scored.filter((s) => s.phraseScore === top).map((s) => s.offer);
  }
  return candidates;
}

export function capabilityIdsForProblemSlug(slug) {
  return PROBLEMS[slug]?.capability_ids ?? [];
}

export function providersForCapabilityIds(ids = []) {
  const providers = new Set();
  for (const id of ids) {
    for (const provider of CAPABILITIES[id]?.providers ?? []) {
      providers.add(provider);
    }
  }
  return [...providers];
}

/**
 * Build routing_friction meta when problem_slug resolves but RouteQuery returns zero matches.
 */
export function buildRoutingFriction(problemSlug) {
  const problem = PROBLEMS[problemSlug];
  if (!problem?.default_offer_id) return null;

  const capability_ids = capabilityIdsForProblemSlug(problemSlug);
  const providers_with_capability = providersForCapabilityIds(capability_ids);

  return {
    problem_slug: problemSlug,
    reason: "no_routing_eligible_offer",
    default_offer_id: problem.default_offer_id,
    capability_ids,
    providers_with_capability,
    portable: true,
    suggested_signal: {
      type: "routing_friction",
      offer_id: problem.default_offer_id,
      confidence: 0.7,
      portable: true,
      note: `problem_slug=${problemSlug}; reason=no_routing_eligible_offer; providers=${providers_with_capability.join(",")}`,
      resolution: {
        problem_slug: problemSlug,
        reason: "no_routing_eligible_offer",
        capability_ids,
        providers_with_capability,
      },
    },
  };
}

export { PROBLEMS, NEEDS, MARKETS, CLASSIFIER, CAPABILITIES };
