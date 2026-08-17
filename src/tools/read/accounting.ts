import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  defaultReadToolsDeps,
  type ReadToolsDeps,
  withLpzaClient,
} from '../context.js';

export function registerAccountingTools(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  server.registerTool(
    'lpza_matter_balances',
    {
      description:
        'Get business, trust, and investment balance summary for a matter via `matter.balances/{matter_id}`. The API guide documents the call but does not publish a response JSON example. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406) when the matter ID is invalid, LpzaServerError (500).',
      inputSchema: z.object({
        matter_id: z
          .string()
          .min(1)
          .describe('LawPracticeZA matter_id to retrieve balances for.'),
      }),
    },
    async ({ matter_id }) =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('matter', 'balances', [matter_id]),
      ),
  );

  server.registerTool(
    'lpza_matter_statement',
    {
      description:
        'Get a full accounting statement for a matter via `matter.statement2/{matter_id}` with optional `customer_id`, `startdate`, and `stopdate` form parameters. Returns client and firm header data plus business (`B`), trust (`T`), and investment (`I`) ledger sections per matter. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({
        matter_id: z
          .string()
          .min(1)
          .describe('LawPracticeZA matter_id for the statement.'),
        customer_id: z
          .string()
          .optional()
          .describe(
            'Optional customer_id named parameter — use to scope a client-wide statement.',
          ),
        startdate: z
          .string()
          .optional()
          .describe('Optional statement start date (YYYY-MM-DD).'),
        stopdate: z
          .string()
          .optional()
          .describe('Optional statement end date (YYYY-MM-DD).'),
      }),
    },
    async ({ matter_id, customer_id, startdate, stopdate }) =>
      withLpzaClient(deps.getClient, async (client) => {
        const params: Record<string, string> = {};
        if (customer_id !== undefined) {
          params.customer_id = customer_id;
        }
        if (startdate !== undefined) {
          params.startdate = startdate;
        }
        if (stopdate !== undefined) {
          params.stopdate = stopdate;
        }
        return client.call(
          'matter',
          'statement2',
          [matter_id],
          Object.keys(params).length > 0 ? params : undefined,
        );
      }),
  );

  server.registerTool(
    'lpza_matter_business_entries',
    {
      description:
        'List business ledger entries (invoice-level, not line items) for a matter via `matter.statement3/{matter_id}`. Excludes trust and investment transactions. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({
        matter_id: z
          .string()
          .min(1)
          .describe('LawPracticeZA matter_id to retrieve business entries for.'),
      }),
    },
    async ({ matter_id }) =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('matter', 'statement3', [matter_id]),
      ),
  );
}
