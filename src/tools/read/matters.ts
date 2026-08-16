import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  defaultReadToolsDeps,
  type ReadToolsDeps,
  withLpzaClient,
} from '../context.js';

export function registerMatterTools(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  server.registerTool(
    'lpza_list_matters',
    {
      description:
        'List matters via `matter/list` (`/api/matter/list`). The API guide does not publish a full list response schema. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({}),
    },
    async () =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('matter', 'list'),
      ),
  );

  server.registerTool(
    'lpza_get_matter',
    {
      description:
        'Get a single matter via `matter/detail/{matter_id}`. Optionally pass `lookup=""` (empty string) to return raw foreign-key IDs without resolved display names — required before `matter.update` per the API guide. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406) when the ID is invalid, LpzaServerError (500).',
      inputSchema: z.object({
        matter_id: z
          .string()
          .min(1)
          .describe('LawPracticeZA matter_id for the matter to retrieve.'),
        lookup: z
          .string()
          .optional()
          .describe(
            'When set to an empty string (`""`), disables foreign-key name lookups and returns raw IDs only.',
          ),
      }),
    },
    async ({ matter_id, lookup }) =>
      withLpzaClient(deps.getClient, async (client) => {
        const params =
          lookup !== undefined ? { lookup } : undefined;
        return client.call('matter', 'detail', [matter_id], params);
      }),
  );
}
