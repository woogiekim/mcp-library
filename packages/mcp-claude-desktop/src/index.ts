#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { api } from "./client.js";
import { tools } from "./tools.js";

const server = new Server(
  { name: "mcp-library", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

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

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
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
