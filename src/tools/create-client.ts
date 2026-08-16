import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type { InsertResponse } from '../lpza/types.js';
import {
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
  recordToFormParams,
} from './common.js';

const createClientInputSchema = z.object({
  customer_name: z.string().describe('Display name for the new client.'),
  customer_code: z.string().describe('Unique client code.'),
  department_id: z.string().describe('Department ID for the client.'),
  postaladdress: z.string().optional().describe('Postal address lines.'),
  tradingas: z.string().optional(),
  email: z.string().optional(),
  tel: z.string().optional(),
  cell: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientInputSchema>;

export async function createClient(
  client: LpzaClient,
  input: CreateClientInput,
): Promise<InsertResponse> {
  const params = recordToFormParams(input as Record<string, unknown>);
  return client.call<InsertResponse>('customer', 'insert', undefined, params);
}

export function registerCreateClientTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_create_client',
    {
      description:
        'Create a new client (debtor) via customer.insert. Requires customer_name, customer_code, and department_id.',
      inputSchema: createClientInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await createClient(lpza, input);
      return jsonToolResult(result);
    },
  );
}
