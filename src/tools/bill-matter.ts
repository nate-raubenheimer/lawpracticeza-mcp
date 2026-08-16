import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type { BillMatterResult, BillResponse } from '../lpza/types.js';
import {
  confirmRequiredError,
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
  salesInvoiceUrls,
} from './common.js';

const billMatterInputSchema = z.object({
  confirm: z
    .boolean()
    .describe('Must be true to create a sales invoice from unbilled items.'),
  matter_id: z.string().describe('Matter ID to bill unbilled items for.'),
  matterdraftlineitems: z
    .string()
    .optional()
    .describe(
      'JSON string array of matterdraftlineitem_uids to bill, e.g. \'["13"]\'.',
    ),
  all: z
    .boolean()
    .optional()
    .describe('When true, bill all unbilled items on the matter (sends all=1).'),
});

export type BillMatterInput = z.infer<typeof billMatterInputSchema>;

export async function billMatter(
  client: LpzaClient,
  input: Omit<BillMatterInput, 'confirm'>,
): Promise<BillMatterResult> {
  if (!input.matterdraftlineitems && !input.all) {
    throw new Error(
      'Provide matterdraftlineitems (JSON array of uids) or all: true to bill every unbilled item.',
    );
  }
  if (input.matterdraftlineitems && input.all) {
    throw new Error(
      'Provide either matterdraftlineitems or all: true, not both.',
    );
  }

  const params: Record<string, string> = {};
  if (input.matterdraftlineitems) {
    params.matterdraftlineitems = input.matterdraftlineitems;
  }
  if (input.all) {
    params.all = '1';
  }

  const response = await client.call<BillResponse>(
    'matter',
    'bill',
    [input.matter_id],
    params,
  );

  return {
    ...response,
    ...salesInvoiceUrls(response.uid),
  };
}

export async function handleBillMatter(
  client: LpzaClient | undefined,
  input: BillMatterInput,
): Promise<
  | ReturnType<typeof jsonToolResult>
  | ReturnType<typeof confirmRequiredError>
  | ReturnType<typeof missingClientError>
> {
  if (!input.confirm) {
    return confirmRequiredError('bill the matter');
  }
  if (!client) {
    return missingClientError();
  }
  const { confirm: _confirm, ...rest } = input;
  const result = await billMatter(client, rest);
  return jsonToolResult(result);
}

export function registerBillMatterTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_bill_matter',
    {
      description:
        'Create a sales invoice from unbilled draft items via matter.bill. Bill specific items (matterdraftlineitems JSON array) or all unbilled (all: true). Requires confirm: true.',
      inputSchema: billMatterInputSchema,
    },
    async (input) => handleBillMatter(lpza, input),
  );
}
