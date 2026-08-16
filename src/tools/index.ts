import type { McpServer } from '@modelcontextprotocol/server';

import { registerPingTool } from './ping';
import { registerReadTools } from './read/index';

/**
 * Register all MCP tools: bootstrap ping plus curated read tools (APP-132).
 */
export function registerTools(server: McpServer): void {
  registerPingTool(server);
  registerReadTools(server);
}

/** @deprecated Use registerTools */
export function registerPlaceholderTools(server: McpServer): void {
  registerTools(server);
}
