/**
 * Doctrine routing index — compiled from knowledge/04-Opportunities/_routing/
 */
import {
  PROBLEMS,
  NEEDS,
  MARKETS,
  CLASSIFIER,
} from "../generated/routing-index.mjs";

function scorePhrases(text, phrases = [], exclude = []) {
  const lower = String(text).toLowerCase();
  for (const ex of exclude) {
    if (lower.includes(String(ex).toLowerCase())) return -1;
  }
  let score = 0;
  for (const p of phrases) {
    if (lower.includes(String(p).toLowerCase())) score += 1;
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

export { PROBLEMS, NEEDS, MARKETS, CLASSIFIER };
