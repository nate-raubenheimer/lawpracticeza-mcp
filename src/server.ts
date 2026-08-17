import { McpServer } from '@modelcontextprotocol/server';

import { credentialsFromEnv, LpzaClient, DEFAULT_LPZA_BASE_URL } from './lpza/index.js';
import { SERVER_NAME, SERVER_VERSION } from './meta';
import { registerTools } from './tools/index.js';

export { SERVER_NAME, SERVER_VERSION };

/**
 * Build an MCP server instance with curated LawPracticeZA read and write tools.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  const credentials = credentialsFromEnv();
  const client = credentials
    ? new LpzaClient({
        credentials,
        baseUrl: process.env.LPZA_BASE_URL ?? DEFAULT_LPZA_BASE_URL,
      })
    : undefined;

  registerTools(server, client);
  return server;
}
