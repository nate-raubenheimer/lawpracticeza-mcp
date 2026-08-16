import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import { SERVER_NAME, SERVER_VERSION } from '../meta';

/**
 * Hello-world tool so hosts can confirm the stdio process is alive.
 * Does not call LawPracticeZA.
 */
export function registerPingTool(server: McpServer): void {
  server.registerTool(
    'lpza_ping',
    {
      description:
        'Confirm the LawPracticeZA MCP server process is running. Does not call the LawPracticeZA API. Live access is not available until credentials are configured.',
      inputSchema: z.object({}),
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ok: true,
            server: SERVER_NAME,
            version: SERVER_VERSION,
            liveApi: false,
            message:
              'MCP stdio server is running. No live LawPracticeZA session. Later tickets need LPZA_DATABASE, LPZA_LOGIN_CODE, and LPZA_PASSWORD.',
          }),
        },
      ],
    }),
  );
}
