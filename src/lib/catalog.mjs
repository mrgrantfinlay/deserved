import { OFFERS, SYNCED_AT } from "../generated/catalog.mjs";

export { OFFERS, SYNCED_AT };

export function listOffers() {
  return OFFERS;
}

export function getOfferById(id) {
  return OFFERS.find((o) => o.id === id || o.providerId === id) ?? null;
}

export function getOfferByRef({ offer_id, provider_id, problem_type }) {
  if (offer_id) {
    return OFFERS.find((o) => o.id === offer_id) ?? null;
  }
  if (provider_id && problem_type) {
    return OFFERS.find((o) => o.providerId === provider_id && o.problemType === problem_type) ?? null;
  }
  if (provider_id) {
    return OFFERS.find((o) => o.providerId === provider_id) ?? null;
  }
  return null;
}

export function getOffersByProvider(providerId) {
  return OFFERS.filter((o) => o.providerId === providerId);
}

const STATUS_RANK = {
  certified: 1,
  validated: 0.95,
  provisional: 0.85,
  draft: 0.6,
  unvalidated: 0.5,
  retired: 0,
};

export function statusWeight(status) {
  return STATUS_RANK[status] ?? 0.7;
}

export function filterOffers({ needType, problemType, location, routingEligibleOnly = true }) {
  const loc = (location ?? "").toLowerCase();
  return OFFERS.filter((offer) => {
    if (routingEligibleOnly && offer.routingEligible === false) return false;
    if (needType && offer.needType !== needType) return false;
    if (problemType && offer.problemType !== problemType) return false;
    if (loc && offer.market?.city) {
      const city = offer.market.city.toLowerCase();
      if (!city.includes(loc) && !loc.includes(city)) return false;
    }
    if (offer.validationStatus === "retired") return false;
    return true;
  });
}
