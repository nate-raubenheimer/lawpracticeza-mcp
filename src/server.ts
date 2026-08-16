import { McpServer } from '@modelcontextprotocol/server';

import { SERVER_NAME, SERVER_VERSION } from './meta';
import { registerPlaceholderTools } from './tools/index';

export { SERVER_NAME, SERVER_VERSION };

/**
 * Build an MCP server instance. The HTTP client and curated tools land in
 * later tickets; this factory is the stdio/HTTP-ready surface.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerPlaceholderTools(server);
  return server;
}
