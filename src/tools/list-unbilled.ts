import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type { ChildListResponse, MatterDraftLineItem } from '../lpza/types.js';
import {
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
} from './common.js';

const listUnbilledInputSchema = z.object({
  matter_id: z.string().describe('Matter ID to list unbilled WIP items for.'),
  lookup: z
    .string()
    .optional()
    .describe(
      'Optional lookup mode. Omit for raw IDs; set to include foreign name lookups.',
    ),
});

export type ListUnbilledInput = z.infer<typeof listUnbilledInputSchema>;

export async function listUnbilled(
  client: LpzaClient,
  input: ListUnbilledInput,
): Promise<ChildListResponse<MatterDraftLineItem>> {
  const params: Record<string, string> = {};
  if (input.lookup !== undefined) {
    params.lookup = input.lookup;
  }

  return client.call<ChildListResponse<MatterDraftLineItem>>(
    'matterdraftlineitem',
    'childlist',
    ['matter', input.matter_id],
    Object.keys(params).length > 0 ? params : undefined,
  );
}

export function registerListUnbilledTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_list_unbilled',
    {
      description:
        'List all unbilled (WIP) draft fees and disbursements for a matter via matterdraftlineitem.childlist.',
      inputSchema: listUnbilledInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await listUnbilled(lpza, input);
      return jsonToolResult(result);
    },
  );
}
