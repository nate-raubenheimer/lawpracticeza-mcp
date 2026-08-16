import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type { UpsertDraftFeeResponse } from '../lpza/types.js';
import {
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
  recordToFormParams,
} from './common.js';

const upsertDraftFeeInputSchema = z.object({
  matter_id: z.string().describe('Matter to post the fee to.'),
  product_id: z.string().describe('Posting code (product) ID.'),
  salesagent_id: z.string().describe('Fee earner (salesagent) ID.'),
  unitprice: z.number().describe('Unit price excluding VAT (caller-supplied).'),
  qty: z.number().optional().describe('Quantity. Defaults to 1.'),
  tax: z.number().describe('VAT amount (caller-supplied; do not hardcode a rate).'),
  trantotal: z
    .number()
    .describe('Transaction total including VAT (caller-supplied).'),
  matterdraftlineitem_name: z
    .string()
    .optional()
    .describe('Description of the fee or disbursement.'),
  matterdraftlineitem_uid: z
    .string()
    .optional()
    .describe('Existing draft item UID to update.'),
  srcid: z
    .string()
    .optional()
    .describe('External unique ID for upsert-by-srcid.'),
  minutes: z.number().optional(),
  date: z.string().optional().describe('Transaction date (YYYY-MM-DD).'),
});

export type UpsertDraftFeeInput = z.infer<typeof upsertDraftFeeInputSchema>;

export async function upsertDraftFee(
  client: LpzaClient,
  input: UpsertDraftFeeInput,
): Promise<UpsertDraftFeeResponse> {
  const payload: Record<string, unknown> = {
    ...input,
    qty: input.qty ?? 1,
  };

  const params = recordToFormParams(payload);
  return client.call<UpsertDraftFeeResponse>(
    'matterdraftlineitem',
    'upsert',
    undefined,
    params,
  );
}

export function registerUpsertDraftFeeTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_upsert_draft_fee',
    {
      description:
        'Insert or update an unbilled draft fee via matterdraftlineitem.upsert. Pass unitprice, tax, and trantotal as supplied — VAT is not calculated in this tool. Update by matterdraftlineitem_uid or srcid.',
      inputSchema: upsertDraftFeeInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await upsertDraftFee(lpza, input);
      return jsonToolResult(result);
    },
  );
}
