/**
 * Intake classifier — maps free text → Need.type, Problem.type, urgency, ASP encoding.
 * Phase 1: keyword heuristics. Replace with LLM classifier behind same interface.
 */

const NEED_TYPES = [
  "Recovery",
  "Safety",
  "Belonging",
  "Significance",
  "Growth",
  "Contribution",
];

const PROBLEM_TYPES = [
  "Functional",
  "Emotional",
  "Social",
  "Identity",
  "Systemic",
  "Existential",
];

const NEED_KEYWORDS = {
  Recovery: [
    "pain",
    "hurt",
    "injury",
    "recover",
    "heal",
    "sleep",
    "back",
    "neck",
    "migraine",
    "tension",
    "stiff",
    "sore",
  ],
  Safety: [
    "safe",
    "risk",
    "threat",
    "protect",
    "urgent",
    "emergency",
    "worried",
    "anxious about",
    "scared",
  ],
  Belonging: ["lonely", "alone", "connection", "community", "isolated", "belong"],
  Significance: ["status", "recognition", "respect", "matter", "seen", "heard"],
  Growth: ["learn", "skill", "improve", "better at", "develop", "grow"],
  Contribution: ["purpose", "impact", "help others", "give back", "meaningful work"],
};

const PROBLEM_KEYWORDS = {
  Functional: [
    "pain",
    "can't move",
    "cannot move",
    "function",
    "sleep",
    "back",
    "neck",
    "hip",
    "jaw",
    "headache",
    "physical",
    "body",
    "stiff",
  ],
  Emotional: [
    "stress",
    "anxiety",
    "overwhelmed",
    "burnout",
    "depressed",
    "mood",
    "emotional",
    "panic",
  ],
  Social: ["relationship", "conflict", "team", "family", "awkward", "social"],
  Identity: [
    "who i am",
    "identity",
    "confidence",
    "imposter",
    "not myself",
    "used to be",
  ],
  Systemic: [
    "process",
    "system",
    "bureaucracy",
    "waiting list",
    "nhs",
    "insurance",
    "admin",
  ],
  Existential: ["meaning", "purpose", "why am i", "pointless", "existential"],
};

const PROBLEM_KEYWORDS_EXTRA = {
  Systemic: [
    "sti",
    "std",
    "sexual health",
    "test kit",
    "pharmacy",
    "infection",
    "screening",
    "hiv",
    "chlamydia",
  ],
  Functional: [
    "tooth",
    "teeth",
    "dental",
    "dentist",
    "abscess",
    "broken tooth",
    "jaw pain",
  ],
};

/** Default 8-bit encodings by problem type (Plutchik-ish sufferer state) */
const DEFAULT_PROBLEM_ENCODING = {
  Functional: "00101110",
  Emotional: "00101100",
  Social: "00011100",
  Identity: "00101001",
  Systemic: "00010110",
  Existential: "00001001",
};

function scoreKeywords(text, keywordMap) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [key, words] of Object.entries(keywordMap)) {
    scores[key] = words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
  }
  return scores;
}

function topKey(scores, fallback) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return fallback;
  return sorted[0][0];
}

function inferUrgency(text) {
  const lower = text.toLowerCase();
  if (/\b(today|now|asap|emergency|urgent|can't wait)\b/.test(lower)) return "immediate";
  if (/\b(tonight|tomorrow|24\s*h|next day)\b/.test(lower)) return "24h";
  if (/\b(this week|few days)\b/.test(lower)) return "week";
  return "flexible";
}

function inferLocation(text, explicit) {
  if (explicit?.trim()) return explicit.trim();
  const m = text.match(/\b(in|near|around)\s+([A-Za-z][A-Za-z\s-]{2,40})/i);
  return m ? m[2].trim() : "";
}

/**
 * @param {{ need_description: string, location?: string, urgency?: string }} input
 */
export function classifyIntake(input) {
  const description = String(input.need_description ?? "").trim();
  if (!description) {
    return { ok: false, error: "need_description is required" };
  }

  const lower = description.toLowerCase();
  const needScores = scoreKeywords(description, NEED_KEYWORDS);
  let problemScores = scoreKeywords(description, PROBLEM_KEYWORDS);
  for (const [type, words] of Object.entries(PROBLEM_KEYWORDS_EXTRA)) {
    problemScores[type] = (problemScores[type] ?? 0) + scoreKeywords(description, { [type]: words })[type];
  }

  if (/\b(sti|std|sexual health|worried about infection)\b/.test(lower)) {
    needScores.Safety = (needScores.Safety ?? 0) + 2;
  }
  if (/\b(tooth|dental|emergency)\b/.test(lower)) {
    needScores.Safety = (needScores.Safety ?? 0) + 2;
  }

  if (/\b(burnout|burned out|overwhelmed|can't switch off|exhausted|stress)\b/.test(lower)) {
    problemScores.Emotional = (problemScores.Emotional ?? 0) + 2;
  }
  if (/\b(smile|self-conscious|embarrassed|teeth|whitening|cosmetic)\b/.test(lower)) {
    problemScores.Identity = (problemScores.Identity ?? 0) + 2;
    needScores.Significance = (needScores.Significance ?? 0) + 2;
  }
  if (/\b(medication|prescription|side effect|pills|dosage)\b/.test(lower)) {
    problemScores.Functional = (problemScores.Functional ?? 0) + 2;
  }

  const need_type = topKey(needScores, "Recovery");
  let problem_type = topKey(problemScores, "Functional");

  if (/\b(sti|std|sexual health|chlamydia|gonorrhoea)\b/.test(lower)) {
    problem_type = "Systemic";
  }
  if (/\b(tooth|teeth|dental|dentist|abscess)\b/.test(lower)) {
    problem_type = "Functional";
  }
  if (problem_type === "Functional" && /\b(sti|std|sexual)\b/.test(lower)) {
    problem_type = "Systemic";
  }

  if (/\b(burnout|burned out|overwhelmed|can't switch off)\b/.test(lower) && !/\b(back|neck)\b/.test(lower)) {
    problem_type = "Emotional";
  }
  if (/\b(self-conscious|embarrassed).{0,20}smile\b/.test(lower) || /\bsmile.{0,20}(self-conscious|embarrassed)\b/.test(lower)) {
    problem_type = "Identity";
  }
  if (/\b(medication|prescription|side effect)\b/.test(lower) && !/\b(tooth|teeth|dental|dentist|abscess)\b/.test(lower)) {
    problem_type = "Functional";
  }

  const urgency = input.urgency ?? inferUrgency(description);
  const location = inferLocation(description, input.location);
  const emotional_encoding =
    DEFAULT_PROBLEM_ENCODING[problem_type] ?? DEFAULT_PROBLEM_ENCODING.Functional;

  const confidence =
    0.45 +
    Math.min(0.35, (needScores[need_type] + problemScores[problem_type]) * 0.08);

  return {
    ok: true,
    intake: {
      need_description: description,
      need_type,
      problem_type,
      problem_title: description.slice(0, 200),
      urgency,
      location,
      emotional_encoding,
      classifier: "keyword-v1",
      confidence: Math.min(0.92, confidence),
      need_types: NEED_TYPES,
      problem_types: PROBLEM_TYPES,
    },
  };
}
