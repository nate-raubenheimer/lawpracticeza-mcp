import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type {
  DetailResponse,
  Matter,
  UpdateResponse,
} from '../lpza/types.js';
import {
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
  recordToFormParams,
} from './common.js';

const updateMatterInputSchema = z.object({
  matter_id: z.string().describe('Matter ID to update.'),
  matter_name: z.string().optional(),
  matter_code: z.string().optional(),
  owner_salesagent_id: z.string().optional(),
  customer_id: z.string().optional(),
  department_id: z.string().optional(),
  dateopened: z.string().optional(),
  title: z.string().optional(),
  firstname: z.string().optional(),
  surname: z.string().optional(),
  email: z.string().optional(),
  accountsemail: z.string().optional(),
  address: z.string().optional(),
  cell: z.string().optional(),
  workphone: z.string().optional(),
  fax: z.string().optional(),
  deadfilenumber: z.string().optional(),
  reservetrust: z.number().optional(),
});

export type UpdateMatterInput = z.infer<typeof updateMatterInputSchema>;

export async function updateMatter(
  client: LpzaClient,
  input: UpdateMatterInput,
): Promise<UpdateResponse> {
  const { matter_id, ...changes } = input;

  const detail = await client.call<DetailResponse<Matter>>(
    'matter',
    'detail',
    [matter_id],
    { lookup: '' },
  );

  const merged: Record<string, unknown> = {
    ...detail.data,
    ...changes,
    matter_id,
  };

  const params = recordToFormParams(merged);
  return client.call<UpdateResponse>('matter', 'update', undefined, params);
}

export function registerUpdateMatterTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_update_matter',
    {
      description:
        'Update an existing matter via matter.update. Fetches matter.detail with lookup="" first, merges changes, and POSTs every field (full record, not a partial patch).',
      inputSchema: updateMatterInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await updateMatter(lpza, input);
      return jsonToolResult(result);
    },
  );
}
