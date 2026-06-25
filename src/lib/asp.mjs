/** ASP helpers — 02-Core/03-ASP.md, DESERVED-ONTOLOGY.md */

const LAMBDA = 0.3;

export function hammingDistance(a, b) {
  if (!a || !b || a.length !== 8 || b.length !== 8) return null;
  let d = 0;
  for (let i = 0; i < 8; i += 1) {
    if (a[i] !== b[i]) d += 1;
  }
  return d;
}

export function resonanceFromHamming(h) {
  if (h == null || Number.isNaN(h)) return 0;
  return Math.exp(-LAMBDA * h);
}

export function trustAtToday(score, lastValidated, decayPerDay = 0.002) {
  if (score == null) return 0;
  if (!lastValidated) return score;
  const then = new Date(lastValidated);
  const now = new Date();
  const days = Math.max(0, (now - then) / (1000 * 60 * 60 * 24));
  return score * Math.exp(-decayPerDay * days);
}

export function urgencyMatch(offerUrgent, requestedUrgency) {
  if (!requestedUrgency || requestedUrgency === "flexible") return 1;
  if (requestedUrgency === "immediate" || requestedUrgency === "24h") {
    return offerUrgent ? 1 : 0.35;
  }
  if (requestedUrgency === "week") return offerUrgent ? 1 : 0.75;
  return 1;
}
