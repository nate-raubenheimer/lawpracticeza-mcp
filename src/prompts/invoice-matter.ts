import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const invoiceMatterArgsSchema = z.object({
  matter_id: z.string().describe('Matter ID to invoice.'),
  bill_all: z
    .boolean()
    .optional()
    .describe(
      'When true, bill all unbilled WIP on the matter; when false, bill specific draft line items.',
    ),
  matterdraftlineitem_uids: z
    .array(z.string())
    .optional()
    .describe(
      'Draft line item UIDs to include on the invoice when bill_all is false.',
    ),
  send_invoice: z
    .boolean()
    .optional()
    .describe('When true, email the invoice after billing via salesinvoice.send.'),
});

export function registerInvoiceMatterPrompt(server: McpServer): void {
  server.registerPrompt(
    'lpza_invoice_matter',
    {
      title: 'Invoice a matter',
      description:
        'Workflow to review WIP, bill draft items into a sales invoice, and optionally send by email.',
      argsSchema: invoiceMatterArgsSchema,
    },
    ({
      matter_id,
      bill_all,
      matterdraftlineitem_uids,
      send_invoice,
    }) => {
      const billMode =
        bill_all === true
          ? 'Bill **all** unbilled WIP on the matter (`matter.bill` with `all: 1`).'
          : matterdraftlineitem_uids && matterdraftlineitem_uids.length > 0
            ? `Bill specific draft items: ${matterdraftlineitem_uids.map((uid) => `\`${uid}\``).join(', ')} (\`matter.bill\` with \`matterdraftlineitems\` as a JSON array string).`
            : 'Ask which draft line items to bill, or whether to bill all unbilled WIP.';

      const sendStep = send_invoice
        ? '4. **Send invoice** — call `salesinvoice.send` with the returned `salesinvoice` UID (via `lpza_api_call`). Confirm with the user before sending email.'
        : '4. **Send (optional)** — only call `salesinvoice.send` after explicit user confirmation.';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a sales invoice for matter ${matter_id} in LawPracticeZA.

Follow this workflow:

1. **Review WIP** — call \`lpza_list_unbilled\` with \`matter_id: "${matter_id}"\` and confirm which draft fees/disbursements to invoice.

2. **Bill the matter** — ${billMode}
   Use \`lpza_api_call\`:
   - object: \`matter\`, method: \`bill\`, positional: \`["${matter_id}"]\`
   - params: \`{ all: "1" }\` to bill everything, **or** \`{ matterdraftlineitems: '["uid1","uid2"]' }\` (JSON array string per the API guide)
   Response shape: \`{ what: "salesinvoice", uid: "SI__…" }\`

3. **Verify invoice** — optional reads via \`lpza_api_call\` (e.g. \`salesinvoice.detail\`) if needed. PDF/view URLs follow \`https://lawpracticeza.com/salesinvoice/detail/{uid}\`.

${sendStep}

**Safety:** Billing and sending have financial side effects — confirm amounts and recipients with the user. Do not hardcode VAT. There is no curated \`lpza_bill_matter\` tool yet; \`lpza_api_call\` is the supported path for \`matter.bill\` and \`salesinvoice.send\`.`,
            },
          },
        ],
      };
    },
  );
}
