import { McpServer } from '@modelcontextprotocol/server';

import { SERVER_NAME, SERVER_VERSION } from './meta';
import { registerTools } from './tools/index';

export { SERVER_NAME, SERVER_VERSION };

/**
 * Build an MCP server instance with curated read tools and bootstrap helpers.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerTools(server);
  return server;
}
