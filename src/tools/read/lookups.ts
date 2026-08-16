import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  defaultReadToolsDeps,
  type ReadToolsDeps,
  withLpzaClient,
} from '../context.js';

export function registerLookupTools(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  server.registerTool(
    'lpza_list_departments',
    {
      description:
        'List departments via `department/list` (default) or `department/listforselection`. Use listforselection for compact dropdown-style records. The API guide documents the `/api/{object}/list` pattern but does not publish a full response schema. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({
        for_selection: z
          .boolean()
          .optional()
          .describe(
            'When true, call `department/listforselection` instead of `department/list`.',
          ),
      }),
    },
    async ({ for_selection }) =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call(
          'department',
          for_selection ? 'listforselection' : 'list',
        ),
      ),
  );

  server.registerTool(
    'lpza_list_fee_earners',
    {
      description:
        'List fee earners (sales agents) via `salesagent/list` (`/api/salesagent/list`). The API guide references this endpoint but does not publish a full response schema. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({}),
    },
    async () =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('salesagent', 'list'),
      ),
  );

  server.registerTool(
    'lpza_list_posting_codes',
    {
      description:
        'List posting codes (products) via `product/list` (`/api/product/list`). Posting codes are used when posting fees and disbursements. The API guide documents the list pattern but not a full response schema. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({}),
    },
    async () =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('product', 'list'),
      ),
  );
}
