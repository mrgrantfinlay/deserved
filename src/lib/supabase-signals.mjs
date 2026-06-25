/**
 * Fetch runtime_signals from Supabase for librarian --source supabase.
 */

function creds(env) {
  const baseUrl = (env.SUPABASE_URL || "").replace(/\/+$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "";
  return { baseUrl, serviceKey };
}

function restBase(url) {
  if (url.endsWith("/rest/v1")) return url;
  return `${url}/rest/v1`;
}

export function supabaseRowToSignal(row) {
  const resolution = row.resolution ?? null;
  const attribution_tier =
    resolution && typeof resolution === "object" ? resolution.attribution_tier ?? null : null;
  return {
    id: row.id,
    type: row.signal_type,
    confidence: row.confidence != null ? Number(row.confidence) : 0.7,
    portable: Boolean(row.portable),
    note: row.note ?? "",
    created_at: row.created_at ?? new Date().toISOString(),
    resolution,
    attribution_tier,
  };
}

export async function fetchUnsyncedSignalsFromSupabase(env, offerId) {
  const { baseUrl, serviceKey } = creds(env);
  if (!baseUrl || !serviceKey) {
    return { ok: false, error: "Missing SUPABASE_URL or service role key", signals: [] };
  }

  const query =
    `offer_id=eq.${encodeURIComponent(offerId)}` +
    `&doctrine_synced_at=is.null` +
    `&order=created_at.asc` +
    `&select=id,offer_id,signal_type,confidence,portable,note,created_at,resolution` +
    `&resolution->>attribution_tier=eq.match`;

  const response = await fetch(`${restBase(baseUrl)}/runtime_signals?${query}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  let rows = [];
  try {
    rows = await response.json();
  } catch {
    rows = [];
  }

  if (!response.ok || !Array.isArray(rows)) {
    return { ok: false, error: "runtime_signals query failed", signals: [] };
  }

  const signals = rows.map(supabaseRowToSignal);
  const outcomes = signals.filter((s) => s.type === "outcome");
  const runtimeRate =
    outcomes.length && outcomes.some((s) => s.resolution?.resolved != null)
      ? Math.round(
          (outcomes.filter((s) => s.resolution?.resolved).length / outcomes.length) * 100,
        ) / 100
      : null;

  return { ok: true, signals, runtimeRate };
}

export async function markSignalsSyncedInSupabase(env, ids) {
  if (!ids?.length) return { ok: true, updated: 0 };
  const { baseUrl, serviceKey } = creds(env);
  if (!baseUrl || !serviceKey) {
    return { ok: false, error: "Missing Supabase credentials", updated: 0 };
  }

  const filter = ids.map((id) => encodeURIComponent(id)).join(",");
  const response = await fetch(`${restBase(baseUrl)}/runtime_signals?id=in.(${filter})`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ doctrine_synced_at: new Date().toISOString() }),
  });

  return {
    ok: response.ok,
    updated: ids.length,
    error: response.ok ? null : await response.text(),
  };
}
