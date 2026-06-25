#!/usr/bin/env node
/**
 * MCP stdio server — exposes Deserved RouteQuery, intake classifier, ValidateOffer.
 * Configure in Cursor: command `node`, args [`/path/to/deserved/mcp/server.mjs`]
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { routeQuery } from "../src/lib/route.mjs";
import { classifyIntake } from "../src/lib/classify.mjs";
import { validateOffer } from "../src/lib/validate.mjs";
import { recordSignal, listSignals } from "../src/lib/signal.mjs";
import { listOffers, SYNCED_AT } from "../src/lib/catalog.mjs";
import { runLibrarianSync } from "../scripts/librarian-sync.mjs";

const server = new Server(
  { name: "deserved", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "deserved_route",
      description:
        "Route a sufferer need description to validated human problem-solvers (Offers). Returns ranked Match[] per DESERVED-ONTOLOGY RouteQuery.",
      inputSchema: {
        type: "object",
        properties: {
          need_description: {
            type: "string",
            description: "Free-text description of the need/problem in plain language",
          },
          location: { type: "string", description: "City or market, e.g. Glasgow" },
          urgency: {
            type: "string",
            enum: ["immediate", "24h", "week", "flexible"],
          },
          routing_source: {
            type: "string",
            enum: ["llm", "human", "organic"],
            default: "llm",
          },
        },
        required: ["need_description"],
      },
    },
    {
      name: "deserved_classify_intake",
      description:
        "Classify intake text into Need.type, Problem.type, urgency, and ASP emotional_encoding without routing.",
      inputSchema: {
        type: "object",
        properties: {
          need_description: { type: "string" },
          location: { type: "string" },
          urgency: { type: "string" },
        },
        required: ["need_description"],
      },
    },
    {
      name: "deserved_validate_offer",
      description:
        "Run ValidateOffer economics gates for a provider/offer id (owner earnings, CFA, resolution rate/count, trust).",
      inputSchema: {
        type: "object",
        properties: {
          offer_id: { type: "string", description: "Provider slug, e.g. deserved-massage" },
          target_status: {
            type: "string",
            enum: ["provisional", "validated", "certified"],
            default: "validated",
          },
          economics: {
            type: "object",
            properties: {
              owner_earnings_positive: { type: "boolean" },
              cfa_status: { type: "boolean" },
              resolution_rate: { type: "number" },
              resolution_count: { type: "number" },
            },
          },
        },
        required: ["offer_id"],
      },
    },
    {
      name: "deserved_record_signal",
      description: "RecordSignal — persist runtime outcome/friction/pattern for an offer (RecordSignal action).",
      inputSchema: {
        type: "object",
        properties: {
          offer_id: { type: "string" },
          provider_id: { type: "string" },
          problem_type: { type: "string" },
          type: { type: "string", enum: ["booking", "outcome", "friction", "pattern_reused", "funnel_anomaly", "capability_gap"] },
          resolution: { type: "object", properties: { resolved: { type: "boolean" }, satisfaction_score: { type: "number" } } },
          note: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
    {
      name: "deserved_list_signals",
      description: "List runtime signals for an offer_id or provider_id.",
      inputSchema: {
        type: "object",
        properties: {
          offer_id: { type: "string" },
          provider_id: { type: "string" },
          problem_type: { type: "string" },
        },
      },
    },
    {
      name: "deserved_list_offers",
      description: "List synced offers from knowledge/offers JSON-LD catalog.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "deserved_librarian_sync",
      description:
        "Librarian — fetch runtime signals from DESERVED_API_URL and append to knowledge/04-Opportunities signal logs.",
      inputSchema: {
        type: "object",
        properties: {
          dry_run: { type: "boolean", default: false },
          knowledge_root: { type: "string" },
          api_url: { type: "string" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let result;

  switch (name) {
    case "deserved_route":
      result = routeQuery(args ?? {});
      break;
    case "deserved_classify_intake":
      result = classifyIntake(args ?? {});
      break;
    case "deserved_validate_offer":
      result = validateOffer(args ?? {});
      break;
    case "deserved_record_signal":
      result = await recordSignal(args ?? {}, {});
      break;
    case "deserved_list_signals":
      result = await listSignals(
        args?.offer_id ?? args?.provider_id,
        {},
        args?.problem_type,
      );
      break;
    case "deserved_list_offers":
      result = { ok: true, synced_at: SYNCED_AT, offers: listOffers() };
      break;
    case "deserved_librarian_sync":
      result = await runLibrarianSync({
        dryRun: Boolean(args?.dry_run),
        knowledgeRoot: args?.knowledge_root,
        apiUrl: args?.api_url,
        apiKey: process.env.DESERVED_API_KEY || process.env.SIGNAL_API_KEY || "",
        statePath: process.env.LIBRARIAN_STATE,
      });
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
