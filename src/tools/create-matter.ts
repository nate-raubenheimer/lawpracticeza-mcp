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

const createMatterInputSchema = z.object({
  matter_name: z.string().describe('Display name for the matter.'),
  matter_code: z.string().describe('Unique matter code.'),
  customer_id: z.string().describe('Client ID the matter belongs to.'),
  owner_salesagent_id: z
    .string()
    .optional()
    .describe('Fee earner (salesagent) ID.'),
  dateopened: z
    .string()
    .optional()
    .describe('Date opened (YYYY-MM-DD). Defaults to today if omitted.'),
  department_id: z.string().optional(),
});

export type CreateMatterInput = z.infer<typeof createMatterInputSchema>;

export async function createMatter(
  client: LpzaClient,
  input: CreateMatterInput,
): Promise<InsertResponse> {
  const payload: Record<string, unknown> = { ...input };
  if (!payload.dateopened) {
    payload.dateopened = new Date().toISOString().slice(0, 10);
  }
  const params = recordToFormParams(payload);
  return client.call<InsertResponse>('matter', 'insert', undefined, params);
}

export function registerCreateMatterTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_create_matter',
    {
      description:
        'Create a new matter via matter.insert. Fees can only be posted to a matter.',
      inputSchema: createMatterInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await createMatter(lpza, input);
      return jsonToolResult(result);
    },
  );
}
