/**
 * Deserved directory API — Phase 1
 *
 *   POST /route           RouteQuery → Match[]
 *   POST /intake          Problem classifier only
 *   POST /signal          RecordSignal → Signal + Observation
 *   GET  /signals         List runtime signals for an offer
 *   GET  /offers          Catalog (debug)
 *   GET  /                HTML demo UI (JSON with ?format=json)
 *   GET  /ui              HTML demo UI (always)
 *   GET  /api             JSON API index
 *   GET  /healthz
 */

import { routeQuery } from "./lib/route.mjs";
import { classifyIntake } from "./lib/classify.mjs";
import { validateOffer } from "./lib/validate.mjs";
import { recordSignal, listSignals } from "./lib/signal.mjs";
import { listOffers, SYNCED_AT } from "./lib/catalog.mjs";
import { homeHtml } from "./lib/home.mjs";
import { errorResponse, json, readJson } from "./lib/util.mjs";

function authorizeSignal(request, env) {
  const required = (env.SIGNAL_API_KEY || "").trim();
  if (!required) return null;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== required) {
    return errorResponse("Unauthorized", 401);
  }
  return null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const API_INDEX = {
  ok: true,
  service: "deserved",
  version: "0.2.0",
  docs: "https://github.com/mrgrantfinlay/deserved",
  endpoints: {
    "GET /": "This index",
    "GET /healthz": "Liveness + catalog sync time",
    "GET /offers": "Synced offer catalog (JSON-LD)",
    "POST /intake": "Classify need_description → Need + Problem types",
    "POST /route": "RouteQuery → ranked Match[]",
    "POST /validate-offer": "ValidateOffer economics gates",
    "POST /signal": "RecordSignal — runtime outcome / friction / pattern",
    "GET /signals?offer_id=": "List persisted signals for an offer",
  },
  try_in_browser: ["/healthz", "/offers"],
  route_example: {
    method: "POST",
    path: "/route",
    body: {
      need_description: "Lower back pain in Glasgow",
      location: "Glasgow",
      urgency: "week",
    },
  },
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    try {
      if (
        (url.pathname === "/" || url.pathname === "/ui") &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        const wantsJson = url.pathname === "/" && url.searchParams.get("format") === "json";
        if (wantsJson) {
          const body = { ...API_INDEX, synced_at: SYNCED_AT, offer_count: listOffers().length };
          if (request.method === "HEAD") {
            return new Response(null, { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
          }
          return json(body, 200, CORS);
        }
        if (request.method === "HEAD") {
          return new Response(null, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...CORS } });
        }
        return new Response(homeHtml(listOffers().length, SYNCED_AT), {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...CORS },
        });
      }

      if (url.pathname === "/api" && request.method === "GET") {
        return json(
          { ...API_INDEX, synced_at: SYNCED_AT, offer_count: listOffers().length },
          200,
          CORS,
        );
      }

      if (url.pathname === "/healthz") {
        return json(
          { ok: true, service: "deserved", synced_at: SYNCED_AT, offer_count: listOffers().length },
          200,
          CORS,
        );
      }

      if (url.pathname === "/offers" && request.method === "GET") {
        return json({ ok: true, offers: listOffers(), synced_at: SYNCED_AT }, 200, CORS);
      }

      if (url.pathname === "/intake" && request.method === "POST") {
        const body = await readJson(request);
        const result = classifyIntake(body);
        return json(result, result.ok ? 200 : 400, CORS);
      }

      if (url.pathname === "/route" && request.method === "POST") {
        const body = await readJson(request);
        const result = routeQuery(body);
        return json(result, result.ok ? 200 : 400, CORS);
      }

      if (url.pathname === "/validate-offer" && request.method === "POST") {
        const body = await readJson(request);
        const result = validateOffer(body);
        return json(result, result.ok ? 200 : 404, CORS);
      }

      if (url.pathname === "/signal" && request.method === "POST") {
        const denied = authorizeSignal(request, env);
        if (denied) return denied;
        const body = await readJson(request);
        const result = await recordSignal(body, env);
        return json(result, result.ok ? 200 : 400, CORS);
      }

      if (url.pathname === "/signals" && request.method === "GET") {
        const offerId = url.searchParams.get("offer_id") ?? url.searchParams.get("provider_id");
        if (!offerId) {
          return errorResponse("offer_id or provider_id query param required", 400);
        }
        const result = await listSignals(offerId, env, url.searchParams.get("problem_type"));
        return json(result, result.ok ? 200 : 404, CORS);
      }

      return errorResponse("Not found", 404);
    } catch (err) {
      return errorResponse(err.message ?? "Internal error", 500);
    }
  },
};
