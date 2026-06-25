import { filterOffers, statusWeight } from "./catalog.mjs";
import {
  hammingDistance,
  resonanceFromHamming,
  trustAtToday,
  urgencyMatch,
} from "./asp.mjs";
import { classifyIntake } from "./classify.mjs";
import { newId } from "./util.mjs";

function relevanceBoost(description, offer) {
  const lower = description.toLowerCase();
  if (/\b(tooth|teeth|dental|dentist|abscess|broken tooth)\b/.test(lower)) {
    return offer.providerId === "west-dental" ? 2 : 0.4;
  }
  if (/\b(medication|prescription|side effect|pills|dosage)\b/.test(lower)) {
    return offer.id.includes("medication-review") ? 2 : 0.5;
  }
  if (/\b(sti|std|sexual health|chlamydia)\b/.test(lower)) {
    return offer.id.includes("sti-screening") ? 2 : 0.5;
  }
  if (/\b(burnout|burned out|overwhelmed|stressed)\b/.test(lower)) {
    return offer.id.includes("stress-burnout") ? 2 : 0.6;
  }
  if (/\b(back|neck|spine|lower back)\b/.test(lower)) {
    return offer.id.includes("back-pain") ? 2 : 0.6;
  }
  if (/\b(smile|self-conscious|cosmetic|whitening)\b/.test(lower)) {
    return offer.id.includes("smile-confidence") ? 2 : 0.5;
  }
  return 1;
}

/**
 * RouteQuery — DESERVED-ONTOLOGY.md
 * Rank: resonance × trust(today) × value_score × urgency_match
 */
export function routeQuery(input) {
  const classified = input.intake
    ? { ok: true, intake: input.intake }
    : classifyIntake({
        need_description: input.need_description,
        location: input.location,
        urgency: input.urgency,
      });

  if (!classified.ok) return classified;

  const { intake } = classified;
  const description = intake.need_description ?? input.need_description ?? "";
  const candidates = filterOffers({
    needType: intake.need_type,
    problemType: intake.problem_type,
    location: intake.location || input.location,
  });

  const queryEncoding = intake.emotional_encoding;
  const routing_source = input.routing_source ?? "llm";

  const matches = candidates
    .map((offer) => {
      const offerEnc = offer.offerEncoding ?? "00000000";
      const h =
        offer.hammingDistance ??
        hammingDistance(queryEncoding, offerEnc) ??
        hammingDistance(queryEncoding, offer.problemEncoding ?? queryEncoding);
      const resonance = offer.resonance ?? resonanceFromHamming(h) ?? 0;
      let trust = trustAtToday(offer.trustScore, offer.lastValidated);
      if (trust <= 0) {
        trust = offer.validationStatus === "provisional" ? 0.5 : 0.15;
      }
      const value = Math.min(offer.valueScore / 10, 1) || 0.5;
      const urg = urgencyMatch(offer.urgencyCapable, intake.urgency);
      const status = statusWeight(offer.validationStatus);
      const relevance = relevanceBoost(description, offer);
      const confidence_score = resonance * trust * value * urg * status * relevance;

      return {
        id: newId("match"),
        need_type: intake.need_type,
        problem_type: intake.problem_type,
        problem_title: intake.problem_title,
        offer_id: offer.id,
        provider_id: offer.providerId,
        provider_name: offer.providerName ?? offer.service?.provider?.name ?? offer.providerId,
        dream_outcome: offer.dreamOutcome,
        capabilities_matched: offer.capabilities,
        confidence_score: round(confidence_score, 4),
        routing_source,
        hamming_distance: h,
        resonance: round(resonance, 4),
        trust_score: round(trust, 4),
        value_score: offer.valueScore,
        urgency_match: urg,
        relevance_boost: relevance,
        validation_status: offer.validationStatus,
        doctrine_path: offer.doctrinePath,
        json_ld_path: offer.jsonLdPath,
        market: offer.market,
        price: offer.price,
        currency: offer.currency,
        status: "pending",
        created_at: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.confidence_score - a.confidence_score);

  return {
    ok: true,
    intake,
    matches,
    meta: {
      candidate_count: candidates.length,
      query_encoding: queryEncoding,
    },
  };
}

function round(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
