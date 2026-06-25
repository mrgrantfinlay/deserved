# Ontology ↔ DeservedOS / T2D mapping

Doctrine source: `~/Documents/GitHub/knowledge` (`DESERVED-ONTOLOGY.md`, `04-Opportunities/`).

Runtime cells: **DeservedOS** (massage business, T3), **deserved/** (directory API, Phase 1).

T2D is **not** a separate repo — it lives at `DeservedOS/07-scripts/t2d/` (ADR 0008).

---

## Layer 1 — Reality

| Ontology object | Deserved Phase 1 (`deserved/`) | DeservedOS | T2D (`07-scripts/t2d/`) |
|-----------------|--------------------------------|------------|-------------------------|
| **Need** | `POST /intake` classifies `need_type` from free text | Quiz `goal` enum (`pain_relief`, `stress_sleep`, …) — implicit need, not typed | SCAN pains tagged by client, not Need enum |
| **Problem** | `POST /intake` → `problem_type` + `problem_title` | Quiz `area` + routing → **treatment** (service SKU), not Problem type | Ranked pain statements (`t2d_pains`) |
| **Capability** | From offer JSON-LD `deserved:capabilities[]` | Therapist skills implicit in `quiz-therapist-matrix.json` | — |
| **Person** | Not persisted Phase 1 | Supabase clients, Kit subscribers, quiz leads | — |
| **Provider** | `provider.identifier` in JSON-LD | Single provider (Deserved Massage) | `03-clients/{slug}/` |
| **Offer** | `knowledge/offers/**/*.json` → synced catalog | ICP landings, treatment pages, Acuity appointment types | Headlines → ME packets (copy offers, not directory Offers) |
| **Market** | `location` filter on `POST /route` | Glasgow-only site; no market object | — |

**Gap:** DeservedOS models **one studio’s service menu**. Deserved directory models **cross-provider Offers** validated per problem × market.

---

## Layer 2 — Intelligence

| Ontology object | Deserved Phase 1 | DeservedOS | T2D |
|-----------------|------------------|------------|-----|
| **Match** | `POST /route` → `Match[]` ranked | Quiz result → one treatment + therapist matrix | — |
| **Observation** | — | Funnel anomaly cron, ME scoring notes | Orchestrator gate reports |
| **Hypothesis** | — | ME challenger packets | T2D headline hypotheses |
| **Experiment** | — | ME A/B on homepage slots | Colour blocks / headline tests (spec) |
| **Doctrine** | Reads from `knowledge/04-Opportunities/` (sync) | — | Promote winners → case studies (manual) |

**Reuse:** T2D **validation stack pattern** (pure gates → PASS/FAIL) → `deserved/` `validate.mjs`. ME **ranking by outcome** → future `RecordSignal` weighting.

---

## Layer 3 — Runtime

| Ontology object | Deserved Phase 1 | DeservedOS | T2D |
|-----------------|------------------|------------|-----|
| **Signal** | — | `me_events`, quiz leads, funnel anomalies | ME feedback bridge → pain lifecycle |
| **Resolution** | — | Acuity appointments (Supabase mirror) | — |
| **Trust** | Decay function on `deserved:trustScore` at route time | Google reviews, repeat booking reports | — |
| **Validation** | `POST /validate-offer` → gate report | `check:site-contract`, ME promote rules | Embedded Validation Stack |
| **Metrics** | — | `report:*` scripts, unit economics | `t2d_phase_runs` |

**Future wire:** DeservedOS `appointments` + satisfaction → `POST /signal` on deserved API → `RecordSignal`.

---

## Action types

| Action | Deserved Phase 1 | DeservedOS analogue |
|--------|------------------|---------------------|
| **RouteQuery** | `POST /route` | `treatment-quiz-routing.json` + `quiz_lead.mjs` |
| **ValidateOffer** | `POST /validate-offer` | Economics reports + ME promotion gates |
| **RecordSignal** | Not built | Webhooks + `me_scoring_runs` |
| **RunExperiment** | Not built | ME challenger cycles |
| **CompressToDoctrine** | Manual PR to `knowledge/04-Opportunities/` | T2D promote + Librarian workflow |
| **GraduateProvider** | Not built | Therapist portal / cell economics gates |

---

## Repo boundaries (target)

```
knowledge/     Doctrine — ontology, offer entries, JSON-LD source of truth
deserved/      Directory API + MCP — RouteQuery, ValidateOffer, intake classifier
DeservedOS/    Cell runtime — deservedmassage.com, signals, ME, T2D producer
```

Symlink: `deserved/knowledge` → `~/Documents/GitHub/knowledge` (read-only for agents; catalog synced at build).
