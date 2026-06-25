/**
 * Marketing gate — promote provisional offers when ValidateOffer gates pass.
 */
import { OFFERS } from "../generated/catalog.mjs";
import { validateOffer } from "./validate.mjs";
import { splitMarkdownRaw, rebuildMarkdown } from "./librarian.mjs";

export function patchValidationInRawFrontmatter(rawFm, { validation_status, stageTag }) {
  let fm = rawFm;
  if (validation_status && /^\s*validation_status:\s*.+$/m.test(fm)) {
    fm = fm.replace(/^(\s*validation_status:\s*).+$/m, `$1${validation_status}`);
  }
  if (stageTag) {
    fm = fm.replace(/#stage\/\w+/g, stageTag);
  }
  return fm;
}

export function promoteOpportunityMarkdown(text, validation) {
  const parts = splitMarkdownRaw(text);
  if (!parts) return { ok: false, error: "invalid_frontmatter" };

  const proposed = validation.proposed_status ?? validation.validation_status;
  if (!proposed || proposed === "provisional" || proposed === "rejected") {
    return { ok: true, promoted: false, markdown: text };
  }

  const stageTag = proposed === "certified" ? "#stage/certified" : "#stage/validated";
  const rawFm = patchValidationInRawFrontmatter(parts.rawFm, {
    validation_status: proposed,
    stageTag,
  });

  return {
    ok: true,
    promoted: true,
    proposed_status: proposed,
    markdown: rebuildMarkdown(rawFm, parts.body),
  };
}

export function evaluateOfferPromotion(offerId, economicsOverride = {}) {
  const validation = validateOffer({
    offer_id: offerId,
    target_status: "validated",
    economics: economicsOverride,
  });
  if (!validation.ok) return validation;
  const canPromote =
    validation.validation.result === "validated" ||
    validation.validation.result === "certified";
  return { ...validation, canPromote };
}

export function listPromotionCandidates() {
  return OFFERS.map((offer) => {
    const evalResult = evaluateOfferPromotion(offer.id);
    return {
      offer_id: offer.id,
      current_status: offer.validationStatus,
      can_promote: Boolean(evalResult.canPromote),
      gates_failed: evalResult.validation?.gates_failed ?? [],
      gates_passed: evalResult.validation?.gates_passed ?? [],
    };
  });
}
