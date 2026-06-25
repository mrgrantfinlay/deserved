import { getOfferByRef, getOffersByProvider } from "./catalog.mjs";
import { newId } from "./util.mjs";

const MEMORY = new Map();

const SIGNAL_TYPES = new Set([
  "booking",
  "outcome",
  "friction",
  "pattern_reused",
  "funnel_anomaly",
  "capability_gap",
]);

function storeKey(offerId) {
  return `signals:${offerId}`;
}

async function loadSignals(offerId, env) {
  if (env?.DESERVED_SIGNALS) {
    const raw = await env.DESERVED_SIGNALS.get(storeKey(offerId));
    return raw ? JSON.parse(raw) : [];
  }
  return MEMORY.get(offerId) ?? [];
}

async function saveSignals(offerId, signals, env) {
  if (env?.DESERVED_SIGNALS) {
    await env.DESERVED_SIGNALS.put(storeKey(offerId), JSON.stringify(signals));
    return;
  }
  MEMORY.set(offerId, signals);
}

export function aggregateResolutionRate(signals) {
  const outcomes = signals.filter((s) => s.type === "outcome" && s.resolution?.resolved != null);
  if (!outcomes.length) return null;
  const resolved = outcomes.filter((s) => s.resolution.resolved).length;
  return Math.round((resolved / outcomes.length) * 100) / 100;
}

/**
 * RecordSignal — DESERVED-ONTOLOGY.md (Phase 3 subset)
 */
export async function recordSignal(body, env) {
  if (!body.offer_id && !body.provider_id) {
    return { ok: false, error: "offer_id or provider_id is required" };
  }

  const offer = getOfferByRef({
    offer_id: body.offer_id,
    provider_id: body.provider_id,
    problem_type: body.problem_type,
  });
  if (!offer) {
    return { ok: false, error: "Unknown offer — use offer_id or provider_id + problem_type" };
  }

  const type = body.type ?? body.signal_type ?? "outcome";
  if (!SIGNAL_TYPES.has(type)) {
    return { ok: false, error: `Invalid signal type. Use: ${[...SIGNAL_TYPES].join(", ")}` };
  }

  const confidence = Number(body.confidence ?? 0.7);
  const portable = Boolean(body.portable ?? body.portable_learning ?? false);

  const signal = {
    id: newId("sig"),
    type,
    source: {
      offer_id: offer.id,
      provider_id: offer.providerId,
      match_id: body.match_id ?? null,
    },
    cell: `${offer.providerId}:${offer.problemType}:${offer.market?.city ?? "unknown"}`,
    portable,
    confidence,
    note: String(body.note ?? "").slice(0, 2000),
    created_at: new Date().toISOString(),
    resolution: body.resolution ?? null,
  };

  const signals = await loadSignals(offer.id, env);
  signals.push(signal);
  await saveSignals(offer.id, signals, env);

  const rolling_rate = aggregateResolutionRate(signals);

  const observation =
    confidence >= 0.5
      ? {
          id: newId("obs"),
          signal_id: signal.id,
          description: signal.note || `Signal ${type} recorded for ${offer.id}`,
          observed_at: signal.created_at,
          observer: body.observer ?? "system",
          context: {
            offer_id: offer.id,
            doctrine_path: offer.doctrinePath,
            portable,
          },
        }
      : null;

  return {
    ok: true,
    signal,
    observation,
    offer: {
      id: offer.id,
      provider_id: offer.providerId,
      doctrine_path: offer.doctrinePath,
      doctrine_resolution_rate: offer.economics?.resolution_rate,
      runtime_resolution_rate: rolling_rate,
      signal_count: signals.length,
    },
    meta: {
      persisted: Boolean(env?.DESERVED_SIGNALS),
      compress_to_doctrine: "Append signal log line to knowledge/04-Opportunities/ via Librarian PR",
    },
  };
}

export async function listSignals(offerRef, env, problemType) {
  let offers = [];
  const byId = getOfferByRef({ offer_id: offerRef });
  if (byId) {
    offers = [byId];
  } else if (problemType) {
    const one = getOfferByRef({ provider_id: offerRef, problem_type: problemType });
    offers = one ? [one] : [];
  } else {
    offers = getOffersByProvider(offerRef);
  }

  if (!offers.length) {
    return { ok: false, error: `Unknown offer or provider: ${offerRef}` };
  }

  const bundles = [];
  for (const offer of offers) {
    const signals = await loadSignals(offer.id, env);
    bundles.push({
      offer_id: offer.id,
      provider_id: offer.providerId,
      problem_type: offer.problemType,
      signals,
      runtime_resolution_rate: aggregateResolutionRate(signals),
      signal_count: signals.length,
    });
  }

  return {
    ok: true,
    offers: bundles,
    signal_count: bundles.reduce((n, b) => n + b.signal_count, 0),
  };
}

/** Test helper */
export function clearMemorySignals() {
  MEMORY.clear();
}
