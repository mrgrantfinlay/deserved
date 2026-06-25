# Deploy — deserved Worker

## Prerequisites

- Cloudflare account: `828d1205c95a96fd9f7a7683b30cb196` (Grantwilliamfinlay@gmail.com)
- KV namespace `DESERVED_SIGNALS` (production + preview IDs in `wrangler.jsonc`)

## Local deploy

```bash
cd ~/Documents/GitHub/deserved
KNOWLEDGE_ROOT=../knowledge npm run sync:doctrine
npx wrangler secret put SIGNAL_API_KEY   # optional; pairs with DeservedOS DESERVED_API_KEY
npx wrangler deploy
```

Worker URL: `https://deserved.grantwilliamfinlay.workers.dev` (shown after deploy).

## GitHub Actions (`deploy.yml`)

Repository secrets:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Workers + KV edit token |
| `CLOUDFLARE_ACCOUNT_ID` | `828d1205c95a96fd9f7a7683b30cb196` |
| `SIGNAL_API_KEY` | optional shared secret for `POST /signal` |

Push to `main` triggers deploy (checks out `knowledge` for `sync:doctrine`).

## DeservedOS production

```bash
# DeservedOS Worker secrets
DESERVED_API_URL=https://deserved.<subdomain>.workers.dev
DESERVED_API_KEY=<same as SIGNAL_API_KEY>
```

## Librarian CI

Workflow lives in **knowledge** repo (`.github/workflows/librarian-sync.yml`).

Secrets on **knowledge** repo:

| Secret | Value |
|--------|--------|
| `DESERVED_API_URL` | deployed Worker URL |
| `DESERVED_API_KEY` | optional Bearer token |

Runs weekly (Monday 06:00 UTC) or via `workflow_dispatch`; opens PR `librarian/signal-sync`.

State file: `knowledge/.deserved-librarian-state.json` (committed with PRs).
