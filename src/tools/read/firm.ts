import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  defaultReadToolsDeps,
  type ReadToolsDeps,
  withLpzaClient,
} from '../context.js';

export function registerFirmTool(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  server.registerTool(
    'lpza_firm_details',
    {
      description:
        'Retrieve firm (company) details via `company.detail/only`. Returns firm name, VAT registration (`vatflag`, `vatnumber`), contact details, and related company fields. There is only one company record per LawPracticeZA instance, so the positional segment is always `only`. Requires credentials. Errors: credentials_missing, LpzaAuthError (403), LpzaValidationError (406), LpzaServerError (500).',
      inputSchema: z.object({}),
    },
    async () =>
      withLpzaClient(deps.getClient, async (client) =>
        client.call('company', 'detail', ['only']),
      ),
  );
}
