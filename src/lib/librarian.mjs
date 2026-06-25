/**
 * Librarian — compress runtime RecordSignal → knowledge/04-Opportunities signal log.
 * Schema: YYYY-MM-DD | signal_type | confidence | portable? | note
 *
 * Frontmatter is patched in-place (string surgery) so hash-tags and comments survive.
 */
import { parse } from "yaml";

export function splitMarkdownRaw(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  return { rawFm: match[1], body: match[2] };
}

/** Parse frontmatter for tests/readers — not used when writing. */
export function splitMarkdown(text) {
  const parts = splitMarkdownRaw(text);
  if (!parts) return null;
  return { frontmatter: parse(parts.rawFm), body: parts.body, rawFm: parts.rawFm };
}

export function rebuildMarkdown(rawFm, body) {
  return `---\n${rawFm.trimEnd()}\n---\n${body}`;
}

export function formatSignalLine(signal) {
  const date = (signal.created_at || new Date().toISOString()).slice(0, 10);
  const confidence = Number(signal.confidence ?? 0.7).toFixed(2);
  const portable = signal.portable ? "true" : "false";
  const note =
    String(signal.note ?? "")
      .replace(/\|/g, "—")
      .trim() || `Signal ${signal.type}`;
  return `${date} | ${signal.type} | ${confidence} | ${portable} | ${note}`;
}

export function pickUnsyncedSignals(signals, syncedIds = []) {
  const seen = new Set(syncedIds);
  return (signals || []).filter((s) => s.id && !seen.has(s.id));
}

export function appendSignalLogLines(body, newLines) {
  if (!newLines.length) return { body, appended: 0 };
  const re = /(## Signal log\s*\n\s*```\n)([\s\S]*?)(```)/;
  const match = body.match(re);
  if (!match) return { body, appended: 0, error: "missing_signal_log" };

  const existing = match[2].replace(/\n$/, "");
  const block = existing ? `${existing}\n${newLines.join("\n")}` : newLines.join("\n");
  return {
    body: body.replace(re, `${match[1]}${block}${match[3]}`),
    appended: newLines.length,
  };
}

/**
 * Patch economics + last_validated without YAML round-trip (preserves #tags, comments).
 */
export function patchEconomicsInRawFrontmatter(rawFm, { runtimeRate, outcomeCount }) {
  let fm = rawFm;
  const today = new Date().toISOString().slice(0, 10);

  if (runtimeRate != null && /^\s*resolution_rate:\s*.+$/m.test(fm)) {
    fm = fm.replace(/^(\s*resolution_rate:\s*).+$/m, `$1${runtimeRate}`);
  }

  if (outcomeCount != null) {
    const currentMatch = fm.match(/^(\s*resolution_count:\s*)(\d+)/m);
    const current = currentMatch ? Number(currentMatch[2]) : 0;
    if (outcomeCount > current && /^\s*resolution_count:\s*.+$/m.test(fm)) {
      fm = fm.replace(/^(\s*resolution_count:\s*).+$/m, `$1${outcomeCount}`);
    }
  }

  if (/^\s*last_validated:\s*.+$/m.test(fm)) {
    fm = fm.replace(/^(\s*last_validated:\s*).+$/m, `$1${today}`);
  } else {
    fm = `${fm.trimEnd()}\nlast_validated: ${today}`;
  }

  return fm;
}

export function countOutcomeSignals(signals) {
  return (signals || []).filter((s) => s.type === "outcome").length;
}

/**
 * Merge runtime signals into one opportunity markdown file.
 */
export function patchOpportunityMarkdown(text, signals, syncedIds = []) {
  const parts = splitMarkdownRaw(text);
  if (!parts) return { ok: false, error: "invalid_frontmatter" };

  const pending = pickUnsyncedSignals(signals, syncedIds);
  if (!pending.length) {
    return { ok: true, appended: 0, newSyncedIds: [], markdown: text };
  }

  const lines = pending.map(formatSignalLine);
  const { body, appended, error } = appendSignalLogLines(parts.body, lines);
  if (error) return { ok: false, error };

  const runtimeRate =
    signals.length && signals.some((s) => s.type === "outcome")
      ? aggregateResolutionRateFromSignals(signals)
      : null;

  const rawFm = patchEconomicsInRawFrontmatter(parts.rawFm, {
    runtimeRate,
    outcomeCount: countOutcomeSignals(signals),
  });

  return {
    ok: true,
    appended,
    newSyncedIds: pending.map((s) => s.id),
    markdown: rebuildMarkdown(rawFm, body),
  };
}

function aggregateResolutionRateFromSignals(signals) {
  const outcomes = signals.filter((s) => s.type === "outcome" && s.resolution?.resolved != null);
  if (!outcomes.length) return null;
  const resolved = outcomes.filter((s) => s.resolution.resolved).length;
  return Math.round((resolved / outcomes.length) * 100) / 100;
}

export function loadLibrarianState(raw) {
  if (!raw) return { synced: {}, last_sync: null };
  try {
    const data = JSON.parse(raw);
    return { synced: data.synced ?? {}, last_sync: data.last_sync ?? null };
  } catch {
    return { synced: {}, last_sync: null };
  }
}

export function saveLibrarianState(state) {
  return JSON.stringify(
    { synced: state.synced, last_sync: new Date().toISOString() },
    null,
    2,
  );
}
