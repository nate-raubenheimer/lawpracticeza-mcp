import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type { CreateTransferResponse } from '../lpza/types.js';
import {
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
  recordToFormParams,
} from './common.js';

const createTransferInputSchema = z.object({
  matterset_name: z
    .string()
    .describe('Reference or ID for the whole transfer transaction.'),
  buyer_customer_id: z.string().describe('Existing buyer client ID.'),
  buyer_owner_salesagent_id: z
    .string()
    .describe('Fee earner ID for the buyer matter.'),
  buyer_matter_code: z.string().describe('Matter code for the buyer side.'),
  buyer_matter_name: z.string().describe('Matter name for the buyer side.'),
  seller_customer_id: z.string().describe('Existing seller client ID.'),
  seller_owner_salesagent_id: z
    .string()
    .describe('Fee earner ID for the seller matter.'),
  seller_matter_code: z.string().describe('Matter code for the seller side.'),
  seller_matter_name: z.string().describe('Matter name for the seller side.'),
});

export type CreateTransferInput = z.infer<typeof createTransferInputSchema>;

export async function createTransfer(
  client: LpzaClient,
  input: CreateTransferInput,
): Promise<CreateTransferResponse> {
  const params = recordToFormParams(input as Record<string, unknown>);
  return client.call<CreateTransferResponse>(
    'matterset',
    'createtransfer',
    undefined,
    params,
  );
}

export function registerCreateTransferTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_create_transfer',
    {
      description:
        'Create buyer and seller matters for a conveyancing transfer via matterset.createtransfer.',
      inputSchema: createTransferInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await createTransfer(lpza, input);
      return jsonToolResult(result);
    },
  );
}
