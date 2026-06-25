#!/usr/bin/env node
/**
 * Build deserved catalog from knowledge doctrine:
 *   - 04-Opportunities/*.md (frontmatter = source of truth for economics)
 *   - offers JSON tree (JSON-LD companions via json_ld_path)
 * Run: npm run sync:doctrine
 */
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const KNOWLEDGE_ROOT = path.resolve(ROOT, "../knowledge");
const OPPORTUNITIES_SRC = path.join(KNOWLEDGE_ROOT, "04-Opportunities");
const OFFERS_SRC = path.join(KNOWLEDGE_ROOT, "offers");
const OFFERS_DST = path.join(ROOT, "data/offers");
const OPPORTUNITIES_DST = path.join(ROOT, "data/opportunities");
const GENERATED = path.join(ROOT, "src/generated/catalog.mjs");

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return parseYaml(match[1]);
}

function parseSignalLog(body) {
  const section = body.match(/## Signal log\s+```([\s\S]*?)```/);
  if (!section) return [];
  return section[1]
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, type, confidence, portable, ...noteParts] = line.split("|").map((s) => s.trim());
      return {
        date,
        type,
        confidence: Number(confidence),
        portable: portable === "true",
        note: noteParts.join("|"),
      };
    });
}

function extractMarket(raw, doctrineMarket) {
  if (doctrineMarket?.city) {
    return {
      city: doctrineMarket.city,
      country: doctrineMarket.country ?? "UK",
      radiusKm: doctrineMarket.radius_km ?? null,
    };
  }
  const area = raw.areaServed;
  if (!area) return { city: "", country: "" };
  if (typeof area === "string") {
    const [city, country] = area.split(",").map((s) => s.trim());
    return { city: city ?? "", country: country ?? "" };
  }
  const mid = area.geoMidpoint ?? {};
  return {
    city: mid.addressLocality ?? "",
    country: mid.addressCountry ?? "GB",
    radiusM: area.geoRadius ? Number(area.geoRadius) : null,
  };
}

function mergeOffer(doctrine, raw, jsonRelPath, opportunityFile) {
  const opportunityId = opportunityFile.replace(/\.md$/, "");
  const caps = doctrine.capabilities ?? [];
  const capabilityNames = caps.map((c) => (typeof c === "string" ? c : c.name));

  return {
    id: opportunityId,
    providerId: doctrine.provider_id,
    providerName: doctrine.provider_name,
    doctrinePath: `04-Opportunities/${opportunityFile}`,
    jsonLdPath: doctrine.json_ld_path ?? jsonRelPath,
    sourcePath: jsonRelPath.replace(/\\/g, "/"),
    service: raw,
    needType: doctrine.need_type ?? raw["deserved:needType"] ?? null,
    problemType: doctrine.problem_type ?? raw["deserved:problemType"] ?? null,
    problemTitle: doctrine.problem_title ?? raw.description ?? "",
    dreamOutcome: doctrine.offer?.dream_outcome ?? raw["deserved:dreamOutcome"] ?? raw.name ?? "",
    problemEncoding: doctrine.asp?.problem_encoding ?? raw["deserved:problemEncoding"] ?? null,
    offerEncoding: doctrine.asp?.offer_encoding ?? raw["deserved:offerEncoding"] ?? null,
    hammingDistance: doctrine.asp?.hamming_distance ?? raw["deserved:hammingDistance"] ?? null,
    resonance: doctrine.asp?.resonance ?? raw["deserved:resonance"] ?? null,
    trustScore: doctrine.trust_score ?? raw["deserved:trustScore"] ?? 0,
    valueScore: doctrine.offer?.value_score ?? raw["deserved:valueScore"] ?? 0,
    resolutionRate: doctrine.economics?.resolution_rate ?? raw["deserved:resolutionRate"] ?? 0,
    validationStatus: doctrine.validation_status ?? raw["deserved:validationStatus"] ?? "draft",
    urgencyCapable: Boolean(doctrine.market?.urgency_capable ?? raw["deserved:urgencyCapable"]),
    capabilities: capabilityNames.length ? capabilityNames : raw["deserved:capabilities"] ?? [],
    capabilityDetails: caps,
    market: extractMarket(raw, doctrine.market),
    price: doctrine.offer?.price ?? raw.offers?.price ?? null,
    currency: doctrine.offer?.currency ?? raw.offers?.priceCurrency ?? "GBP",
    perceivedLikelihood: doctrine.offer?.perceived_likelihood ?? raw["deserved:perceivedLikelihood"] ?? null,
    timeToResolution: doctrine.offer?.time_to_resolution ?? raw["deserved:timeToResolution"] ?? null,
    effortRequired: doctrine.offer?.effort_required ?? raw["deserved:effortRequired"] ?? null,
    lastValidated: doctrine.last_validated ?? raw["deserved:lastValidated"] ?? null,
    economics: {
      owner_earnings_positive: Boolean(doctrine.economics?.owner_earnings_positive),
      cfa_status: Boolean(doctrine.economics?.cfa_status),
      resolution_rate: doctrine.economics?.resolution_rate ?? 0,
      resolution_count: doctrine.economics?.resolution_count ?? 0,
    },
    signalLog: [],
  };
}

async function copyOffersTree() {
  async function walk(dir, base = dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full, base);
      } else if (ent.name.endsWith(".json")) {
        const rel = path.relative(base, full);
        const dst = path.join(OFFERS_DST, rel);
        await mkdir(path.dirname(dst), { recursive: true });
        await cp(full, dst);
      }
    }
  }
  await mkdir(OFFERS_DST, { recursive: true });
  await walk(OFFERS_SRC);
}

async function main() {
  await mkdir(path.dirname(GENERATED), { recursive: true });
  await mkdir(OPPORTUNITIES_DST, { recursive: true });
  await copyOffersTree();

  const files = await readdir(OPPORTUNITIES_SRC);
  const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "README.md");

  const offers = [];
  for (const file of mdFiles) {
    const srcPath = path.join(OPPORTUNITIES_SRC, file);
    const text = await readFile(srcPath, "utf8");
    const doctrine = parseFrontmatter(text);
    if (!doctrine?.provider_id || !doctrine?.json_ld_path) {
      console.warn(`Skip ${file}: missing provider_id or json_ld_path`);
      continue;
    }

    const jsonPath = path.join(KNOWLEDGE_ROOT, doctrine.json_ld_path);
    const raw = JSON.parse(await readFile(jsonPath, "utf8"));
    const jsonRel = path.relative(OFFERS_SRC, jsonPath);
    const entry = mergeOffer(doctrine, raw, jsonRel, file);
    entry.signalLog = parseSignalLog(text);

    await cp(srcPath, path.join(OPPORTUNITIES_DST, file));
    offers.push(entry);
  }

  offers.sort((a, b) => a.id.localeCompare(b.id));

  const body = `// AUTO-GENERATED by scripts/sync-doctrine.mjs — do not edit
export const OFFERS = ${JSON.stringify(offers, null, 2)};
export const SYNCED_AT = ${JSON.stringify(new Date().toISOString())};
export const DOCTRINE_SOURCE = ${JSON.stringify(KNOWLEDGE_ROOT)};
`;
  await writeFile(GENERATED, body, "utf8");
  console.log(
    `Synced ${offers.length} opportunity(ies) from 04-Opportunities/ + JSON-LD → catalog.mjs`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
