import type { McpServer } from '@modelcontextprotocol/server';

import { registerPingTool } from './ping';

/**
 * Placeholder MCP tools for the bootstrap. Curated read/write/billing tools
 * are added in APP-132, APP-137, and APP-133.
 */
export function registerPlaceholderTools(server: McpServer): void {
  registerPingTool(server);
}
