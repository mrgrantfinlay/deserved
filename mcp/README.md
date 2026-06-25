# MCP — Deserved tools

Stdio MCP server wrapping the same logic as the HTTP Worker.

## Cursor / Claude Desktop config

```json
{
  "mcpServers": {
    "deserved": {
      "command": "node",
      "args": ["/Users/grant/Documents/GitHub/deserved/mcp/server.mjs"],
      "cwd": "/Users/grant/Documents/GitHub/deserved"
    }
  }
}
```

Run `npm run sync:doctrine` before first use so `src/generated/catalog.mjs` exists.

## Tools

| Tool | HTTP equivalent |
|------|-----------------|
| `deserved_route` | `POST /route` |
| `deserved_classify_intake` | `POST /intake` |
| `deserved_validate_offer` | `POST /validate-offer` |
| `deserved_list_offers` | `GET /offers` |

Doctrine: `../knowledge/DESERVED-ONTOLOGY.md`, `../knowledge/04-Opportunities/`.
