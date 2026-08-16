import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import {
  confirmRequiredError,
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
} from './common.js';

const sendInvoiceInputSchema = z.object({
  confirm: z
    .boolean()
    .describe('Must be true to email the sales invoice to the debtor.'),
  salesinvoice_uid: z
    .string()
    .describe('Sales invoice UID to send via email.'),
});

export type SendInvoiceInput = z.infer<typeof sendInvoiceInputSchema>;

export async function sendInvoice(
  client: LpzaClient,
  input: Omit<SendInvoiceInput, 'confirm'>,
): Promise<null> {
  return client.call<null>(
    'salesinvoice',
    'send',
    [input.salesinvoice_uid],
  );
}

export async function handleSendInvoice(
  client: LpzaClient | undefined,
  input: SendInvoiceInput,
): Promise<
  | ReturnType<typeof jsonToolResult>
  | ReturnType<typeof confirmRequiredError>
  | ReturnType<typeof missingClientError>
> {
  if (!input.confirm) {
    return confirmRequiredError('send the invoice');
  }
  if (!client) {
    return missingClientError();
  }
  const { confirm: _confirm, ...rest } = input;
  const result = await sendInvoice(client, rest);
  return jsonToolResult(result);
}

export function registerSendInvoiceTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_send_invoice',
    {
      description:
        'Email a sales invoice to the debtor via salesinvoice.send. Requires confirm: true.',
      inputSchema: sendInvoiceInputSchema,
    },
    async (input) => handleSendInvoice(lpza, input),
  );
}
