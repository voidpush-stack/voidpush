#!/usr/bin/env node
/**
 * VoidPush MCP Server
 *
 * Exposes VoidPush as an MCP tool so AI agents (Claude, Codex, etc.)
 * can push code anonymously, check scores, and query the relay network.
 *
 * Usage (Claude Desktop config):
 * {
 *   "mcpServers": {
 *     "voidpush": {
 *       "command": "npx",
 *       "args": ["@voidpush/mcp-server"],
 *       "env": { "VOIDPUSH_API_URL": "https://api.voidpush.dev" }
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { VoidPushClient } from "@voidpush/sdk";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const client = new VoidPushClient({
  apiUrl: process.env.VOIDPUSH_API_URL ?? "https://api.voidpush.dev",
});

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "vpush_init",
    description: "Generate a new ephemeral void identity (72h TTL). Must be called before any push.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ttl:    { type: "number",  description: "Identity TTL in hours (default: 72)" },
        link:   { type: "boolean", description: "Link to previous ZK reputation chain" },
        region: { type: "string",  description: "Preferred relay region: ap/eu/us/sa/auto", enum: ["ap","eu","us","sa","auto"] },
      },
    },
  },
  {
    name: "vpush_push",
    description: "Push commits anonymously through the relay chain. Strips all author metadata before transmission.",
    inputSchema: {
      type: "object" as const,
      required: ["remote", "branch"],
      properties: {
        remote: { type: "string", description: "Git remote name (e.g. 'origin')" },
        branch: { type: "string", description: "Branch to push (e.g. 'main')" },
        hops:   { type: "number", description: "Number of relay hops (3-9, default: 3)" },
        force:  { type: "boolean", description: "Force push" },
      },
    },
  },
  {
    name: "vpush_score",
    description: "Fetch the quality score for the last anonymous push. Scores are available ~24h after push.",
    inputSchema: {
      type: "object" as const,
      properties: {
        void_id: { type: "string", description: "Void identity ID (optional — uses current identity)" },
        pr_id:   { type: "number", description: "Filter by specific PR ID" },
        json:    { type: "boolean", description: "Return raw JSON" },
      },
    },
  },
  {
    name: "vpush_status",
    description: "Check current void identity status — TTL remaining, ZK chain, relay preferences.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "vpush_leaderboard",
    description: "Get the anonymous contributor leaderboard. No real names — void IDs only.",
    inputSchema: {
      type: "object" as const,
      properties: {
        period: { type: "string", description: "Time period", enum: ["week","month","alltime"] },
        limit:  { type: "number", description: "Number of entries (default: 10, max: 100)" },
        region: { type: "string", description: "Filter by region" },
      },
    },
  },
  {
    name: "vpush_relay_ls",
    description: "List available relay nodes with latency and trust scores.",
    inputSchema: {
      type: "object" as const,
      properties: {
        region: { type: "string", description: "Filter by region: ap/eu/us/sa" },
      },
    },
  },
  {
    name: "vpush_stats",
    description: "Get global VoidPush network statistics.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function runVpush(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync("vpush", args, {
      timeout: 30_000,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return (stdout + stderr).trim();
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    throw new Error(e.stderr ?? e.message ?? String(err));
  }
}

async function handleTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {

    case "vpush_init": {
      const flags: string[] = ["init"];
      if (input.ttl)    flags.push("--ttl", String(input.ttl));
      if (input.link)   flags.push("--link");
      if (input.region) flags.push("--relay-region", String(input.region));
      return runVpush(flags);
    }

    case "vpush_push": {
      const flags = ["push", String(input.remote ?? "origin"), String(input.branch ?? "main")];
      if (input.hops)  flags.push("--hops", String(input.hops));
      if (input.force) flags.push("--force");
      return runVpush(flags);
    }

    case "vpush_score": {
      const flags = ["score"];
      if (input.pr_id) flags.push("--pr", String(input.pr_id));
      if (input.json)  flags.push("--json");
      return runVpush(flags);
    }

    case "vpush_status": {
      // Attempt to read identity info
      return runVpush(["status"]).catch(() => "No active identity. Run vpush_init first.");
    }

    case "vpush_leaderboard": {
      const board = await client.getLeaderboard({
        period: (input.period as "week" | "month" | "alltime") ?? "week",
        limit:  (input.limit as number) ?? 10,
        region: input.region as string | undefined,
      });
      return board
        .map((e, i) => `#${e.rank.toString().padStart(3)} ${e.void_id}  score:${e.avg_score}  commits:${e.total_commits}`)
        .join("\n");
    }

    case "vpush_relay_ls": {
      const flags = ["relay", "ls"];
      if (input.region) flags.push("--region", String(input.region));
      return runVpush(flags);
    }

    case "vpush_stats": {
      const stats = await client.getStats();
      return [
        `Active contributors : ${stats.active_contributors.toLocaleString("en-US")}`,
        `Anon commits        : ${stats.total_anon_commits.toLocaleString("en-US")}`,
        `Anonymity rate      : ${stats.anonymity_rate_pct}%`,
        `Active relays       : ${stats.active_relays}`,
      ].join("\n");
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "voidpush", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: input = {} } = request.params;
  try {
    const result = await handleTool(name, input as Record<string, unknown>);
    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Error: ${msg}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("VoidPush MCP server running\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
