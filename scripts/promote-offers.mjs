#!/usr/bin/env node
/**
 * Marketing gate — promote offers when ValidateOffer economics gates pass.
 *
 *   KNOWLEDGE_ROOT=../knowledge npm run promote:offers
 *   npm run promote:offers -- --dry-run
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OFFERS } from "../src/generated/catalog.mjs";
import { evaluateOfferPromotion, promoteOpportunityMarkdown } from "../src/lib/promote.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_KNOWLEDGE = path.resolve(ROOT, "../knowledge");

function parseArgs(argv) {
  const opts = { dryRun: false, knowledgeRoot: process.env.KNOWLEDGE_ROOT || DEFAULT_KNOWLEDGE };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") opts.dryRun = true;
    else if (argv[i] === "--knowledge-root" && argv[i + 1]) opts.knowledgeRoot = argv[++i];
  }
  return opts;
}

export async function runPromoteOffers(rawOpts = {}) {
  const opts = { ...parseArgs([]), ...rawOpts };
  const results = [];
  let promoted = 0;

  for (const offer of OFFERS) {
    if (offer.validationStatus !== "provisional") {
      results.push({ offer_id: offer.id, ok: true, promoted: false, reason: "not provisional" });
      continue;
    }

    const evalResult = evaluateOfferPromotion(offer.id);
    if (!evalResult.canPromote) {
      results.push({
        offer_id: offer.id,
        ok: true,
        promoted: false,
        gates_failed: evalResult.validation?.gates_failed ?? [],
      });
      continue;
    }

    const doctrineFile = path.join(opts.knowledgeRoot, offer.doctrinePath);
    let text;
    try {
      text = await readFile(doctrineFile, "utf8");
    } catch (error) {
      results.push({ offer_id: offer.id, ok: false, error: error.message });
      continue;
    }

    const patch = promoteOpportunityMarkdown(text, evalResult.validation);
    if (!patch.ok) {
      results.push({ offer_id: offer.id, ok: false, error: patch.error });
      continue;
    }

    if (patch.promoted && !opts.dryRun) {
      await writeFile(doctrineFile, patch.markdown, "utf8");
    }

    if (patch.promoted) promoted += 1;
    results.push({
      offer_id: offer.id,
      ok: true,
      promoted: patch.promoted,
      proposed_status: patch.proposed_status,
      dry_run: opts.dryRun,
    });
  }

  return { ok: true, promoted, results, knowledge_root: opts.knowledgeRoot };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runPromoteOffers(parseArgs(process.argv))
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
