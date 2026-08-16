import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  defaultReadToolsDeps,
  type ReadToolsDeps,
  withLpzaClient,
} from '../context.js';

export function registerClientTools(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  server.registerTool(
    'lpza_list_clients',
    {
      description:
        'List clients (customers) via `customer/list` (`/api/customer/list`). The API guide documents insert responses but not the list shape. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({}),
    },
    async () =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('customer', 'list'),
      ),
  );

  server.registerTool(
    'lpza_get_client',
    {
      description:
        'Get a single client (customer) via `customer/detail/{customer_id}`. Pass the LawPracticeZA `customer_id` (visible in UI URLs or from `lpza_list_clients`). Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406) when the ID is invalid, LpzaServerError (500).',
      inputSchema: z.object({
        customer_id: z
          .string()
          .min(1)
          .describe('LawPracticeZA customer_id for the client to retrieve.'),
      }),
    },
    async ({ customer_id }) =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('customer', 'detail', [customer_id]),
      ),
  );
}
