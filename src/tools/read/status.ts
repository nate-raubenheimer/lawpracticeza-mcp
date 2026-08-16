import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  defaultReadToolsDeps,
  type ReadToolsDeps,
  withLpzaClient,
} from '../context.js';

export function registerStatusTool(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  server.registerTool(
    'lpza_status',
    {
      description:
        'Check the current LawPracticeZA API session via `access.status`. Returns whether the session is logged in, the database name, login identity, and session metadata when authenticated. Requires LPZA_DATABASE, LPZA_LOGIN_CODE, and LPZA_PASSWORD. Errors: credentials_missing (env not set), LpzaAuthError (HTTP 403), LpzaServerError (HTTP 500).',
      inputSchema: z.object({}),
    },
    async () =>
      withLpzaClient(deps.getClient, async (client) => client.status()),
  );
}
