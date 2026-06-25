# Deserved — LLM-queryable directory API

Route real Needs to validated human problem-solvers. Doctrine lives in [`knowledge/`](../knowledge); this repo is the **directory runtime**.

## API surface

| Endpoint | Ontology action | Description |
|----------|-----------------|-------------|
| `POST /route` | **RouteQuery** | Classify + rank `Match[]` |
| `POST /intake` | (classifier) | Need/Problem types + ASP encoding |
| `POST /validate-offer` | **ValidateOffer** | Economics gates from doctrine |
| `POST /signal` | **RecordSignal** | Persist runtime Signal + Observation |
| `GET /signals?offer_id=` | — | List signals (KV-backed in dev/deploy) |
| `GET /offers` | — | Synced catalog |
| `GET /ui` | — | Browser demo |

MCP: [`mcp/server.mjs`](mcp/server.mjs) — `npm run mcp`

## Setup

```bash
cd ~/Documents/GitHub/deserved
npm install
npm run sync:doctrine   # 04-Opportunities/*.md + JSON-LD
npm run dev
npm run open            # http://127.0.0.1:8787/ui
```

Use **http** not https locally.

## Examples

```bash
# Route
curl -s http://127.0.0.1:8787/route -H 'content-type: application/json' -d '{
  "need_description": "Burned out and stressed in Glasgow",
  "location": "Glasgow"
}'

# Record outcome (runtime flywheel)
curl -s http://127.0.0.1:8787/signal -H 'content-type: application/json' -d '{
  "offer_id": "deserved-massage-back-pain-glasgow",
  "type": "outcome",
  "resolution": { "resolved": true, "satisfaction_score": 9 },
  "note": "Pain reduced next day"
}'
```

## Corpus (Glasgow)

6 opportunity cells — 3 providers, 5 problem types (Functional, Emotional, Systemic, Identity):

| Offer | Status |
|-------|--------|
| deserved-massage-back-pain-glasgow | provisional |
| deserved-massage-stress-burnout-glasgow | provisional |
| north-park-pharmacy-sti-screening-glasgow | draft |
| north-park-pharmacy-medication-review-glasgow | draft |
| west-dental-emergency-pain-glasgow | draft |
| west-dental-smile-confidence-glasgow | draft |

## Architecture

```
knowledge/04-Opportunities/*.md + offers/**/*.json
        │ npm run sync:doctrine
        ▼
deserved/src/generated/catalog.mjs
        │
        ├── Worker (HTTP) + DESERVED_SIGNALS KV
        └── MCP stdio server
```

**Next:** production deploy with shared `SIGNAL_API_KEY`; run `npm run librarian:sync` after signals accumulate.

### Librarian (runtime → doctrine)

Append runtime signals to `knowledge/04-Opportunities` signal logs:

```bash
DESERVED_API_URL=http://127.0.0.1:8787 npm run librarian:sync
npm run librarian:sync -- --dry-run
```

Tracks synced signal IDs in `.librarian-state.json`. MCP tool: `deserved_librarian_sync`.

### DeservedOS bridge

Set in DeservedOS Worker / `internal/.env`:

```bash
DESERVED_API_URL=http://127.0.0.1:8787
DESERVED_API_KEY=your-shared-secret   # optional
```

Same value as deserved Worker secret `SIGNAL_API_KEY` (optional in local dev).

Acuity bookings → `booking` signals; hourly cron → `outcome` signals. See DeservedOS `04-docs/architecture/deserved-directory-bridge.md`.

## Related repos

| Repo | Role |
|------|------|
| [knowledge](https://github.com/mrgrantfinlay/knowledge) | Doctrine |
| [DeservedOS](https://github.com/mrgrantfinlay/DeservedOS) | T3 cell — Acuity → `POST /signal` (see bridge doc) |
