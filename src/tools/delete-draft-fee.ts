import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import type { QuickDeleteResponse } from '../lpza/types.js';
import {
  confirmRequiredError,
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
} from './common.js';

const deleteDraftFeeInputSchema = z.object({
  confirm: z
    .boolean()
    .describe('Must be true to delete the draft fee or disbursement.'),
  matterdraftlineitem_uid: z
    .string()
    .optional()
    .describe('Draft item UID to delete.'),
  srcid: z
    .string()
    .optional()
    .describe('External srcid to delete by (alternative to uid).'),
});

export type DeleteDraftFeeInput = z.infer<typeof deleteDraftFeeInputSchema>;

export async function deleteDraftFee(
  client: LpzaClient,
  input: Omit<DeleteDraftFeeInput, 'confirm'>,
): Promise<QuickDeleteResponse> {
  if (!input.matterdraftlineitem_uid && !input.srcid) {
    throw new Error(
      'Provide matterdraftlineitem_uid or srcid to identify the draft item.',
    );
  }

  const params: Record<string, string> = {};
  if (input.srcid) {
    params.srcid = input.srcid;
  }
  if (input.matterdraftlineitem_uid) {
    params.matterdraftlineitem_uid = input.matterdraftlineitem_uid;
  }

  const positional = input.matterdraftlineitem_uid && !input.srcid
    ? [input.matterdraftlineitem_uid]
    : undefined;

  return client.call<QuickDeleteResponse>(
    'matterdraftlineitem',
    'quickdelete',
    positional,
    Object.keys(params).length > 0 ? params : undefined,
  );
}

export async function handleDeleteDraftFee(
  client: LpzaClient | undefined,
  input: DeleteDraftFeeInput,
): Promise<
  | ReturnType<typeof jsonToolResult>
  | ReturnType<typeof confirmRequiredError>
  | ReturnType<typeof missingClientError>
> {
  if (!input.confirm) {
    return confirmRequiredError('delete the draft fee');
  }
  if (!client) {
    return missingClientError();
  }
  const { confirm: _confirm, ...rest } = input;
  const result = await deleteDraftFee(client, rest);
  return jsonToolResult(result);
}

export function registerDeleteDraftFeeTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_delete_draft_fee',
    {
      description:
        'Delete an unbilled draft fee or disbursement via matterdraftlineitem.quickdelete. Requires confirm: true.',
      inputSchema: deleteDraftFeeInputSchema,
    },
    async (input) => handleDeleteDraftFee(lpza, input),
  );
}
