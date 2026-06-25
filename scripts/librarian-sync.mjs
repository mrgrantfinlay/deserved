#!/usr/bin/env node
/**
 * Librarian sync — fetch runtime signals from deserved API → append knowledge signal logs.
 *
 *   DESERVED_API_URL=http://127.0.0.1:8787 npm run librarian:sync
 *   npm run librarian:sync -- --dry-run
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OFFERS } from "../src/generated/catalog.mjs";
import {
  loadLibrarianState,
  patchOpportunityMarkdown,
  saveLibrarianState,
} from "../src/lib/librarian.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_KNOWLEDGE = path.resolve(ROOT, "../knowledge");
const DEFAULT_STATE = path.join(ROOT, ".librarian-state.json");

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    knowledgeRoot: process.env.KNOWLEDGE_ROOT || DEFAULT_KNOWLEDGE,
    apiUrl: (process.env.DESERVED_API_URL || "http://127.0.0.1:8787").replace(/\/+$/, ""),
    apiKey: process.env.DESERVED_API_KEY || process.env.SIGNAL_API_KEY || "",
    statePath: process.env.LIBRARIAN_STATE || DEFAULT_STATE,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") opts.dryRun = true;
    else if (argv[i] === "--knowledge-root" && argv[i + 1]) opts.knowledgeRoot = argv[++i];
    else if (argv[i] === "--api-url" && argv[i + 1]) opts.apiUrl = argv[++i].replace(/\/+$/, "");
    else if (argv[i] === "--state" && argv[i + 1]) opts.statePath = argv[++i];
  }
  return opts;
}

async function fetchSignals(apiUrl, apiKey, offerId) {
  const headers = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(
    `${apiUrl}/signals?offer_id=${encodeURIComponent(offerId)}`,
    { headers },
  );
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.error || `HTTP ${response.status}`, signals: [] };
  }
  const bundle = data.offers?.[0];
  return { ok: true, signals: bundle?.signals ?? [], runtimeRate: bundle?.runtime_resolution_rate };
}

export async function runLibrarianSync(rawOpts = {}) {
  const defaults = parseArgs([]);
  const opts = { ...defaults, ...rawOpts };
  if (!opts.knowledgeRoot) opts.knowledgeRoot = defaults.knowledgeRoot;
  if (!opts.apiUrl) opts.apiUrl = defaults.apiUrl;
  if (!opts.statePath) opts.statePath = defaults.statePath;
  let stateRaw = null;
  try {
    stateRaw = await readFile(opts.statePath, "utf8");
  } catch {
    stateRaw = null;
  }
  const state = loadLibrarianState(stateRaw);

  const results = [];
  let totalAppended = 0;

  for (const offer of OFFERS) {
    const doctrineFile = path.join(opts.knowledgeRoot, offer.doctrinePath);
    const fetched = await fetchSignals(opts.apiUrl, opts.apiKey, offer.id);
    if (!fetched.ok) {
      results.push({ offer_id: offer.id, ok: false, error: fetched.error });
      continue;
    }

    const syncedIds = state.synced[offer.id] ?? [];
    let text;
    try {
      text = await readFile(doctrineFile, "utf8");
    } catch (error) {
      results.push({ offer_id: offer.id, ok: false, error: error.message });
      continue;
    }

    const patch = patchOpportunityMarkdown(text, fetched.signals, syncedIds);
    if (!patch.ok) {
      results.push({ offer_id: offer.id, ok: false, error: patch.error });
      continue;
    }

    if (patch.appended > 0 && !opts.dryRun) {
      await writeFile(doctrineFile, patch.markdown, "utf8");
      state.synced[offer.id] = [...syncedIds, ...patch.newSyncedIds];
    }

    totalAppended += patch.appended;
    results.push({
      offer_id: offer.id,
      ok: true,
      appended: patch.appended,
      signal_count: fetched.signals.length,
      dry_run: opts.dryRun,
    });
  }

  if (!opts.dryRun) {
    await mkdir(path.dirname(opts.statePath), { recursive: true });
    await writeFile(opts.statePath, saveLibrarianState(state), "utf8");
  }

  return {
    ok: true,
    dry_run: opts.dryRun,
    offers_scanned: OFFERS.length,
    lines_appended: totalAppended,
    results,
    state_path: opts.statePath,
  };
}

async function main() {
  const opts = parseArgs(process.argv);
  const summary = await runLibrarianSync(opts);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.lines_appended === 0 && summary.results.some((r) => !r.ok)) {
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
