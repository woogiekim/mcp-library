#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { api } from "./client.js";
import { tools } from "./tools.js";
import { prompts, getPrompt } from "./prompts.js";

const server = new Server(
  { name: "mcp-library", version: "0.2.0" },
  { capabilities: { tools: {}, prompts: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts }));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  return getPrompt(name, args as Record<string, string>);
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "list_usecases":
        result = await api.listUseCases();
        break;

      case "get_usecase":
        result = await api.getUseCase(args.id as string);
        break;

      case "search_usecases":
        result = await api.search(args.query as string, args.limit as number | undefined);
        break;

      case "query_usecases":
        result = await api.query(args.query as string);
        break;

      case "create_usecase":
        result = await api.createUseCase(args);
        break;

      case "delete_usecase":
        await api.deleteUseCase(args.id as string);
        result = { success: true, id: args.id };
        break;

      case "bulk_create_usecases": {
        const usecases = args.usecases as unknown[];
        const results = await Promise.allSettled(
          usecases.map((uc) => api.createUseCase(uc))
        );
        result = results.map((r, i) =>
          r.status === "fulfilled"
            ? { index: i, status: "created", id: r.value.id }
            : { index: i, status: "failed", error: (r.reason as Error).message }
        );
        break;
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
