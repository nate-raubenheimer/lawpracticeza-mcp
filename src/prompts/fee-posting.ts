import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const feePostingArgsSchema = z.object({
  matter_id: z
    .string()
    .describe('Matter ID to post fees or disbursements to.'),
  product_id: z
    .string()
    .optional()
    .describe('Posting code (product) ID when adding a new fee.'),
  salesagent_id: z
    .string()
    .optional()
    .describe('Fee earner (salesagent) ID when adding a new fee.'),
});

export function registerFeePostingPrompt(server: McpServer): void {
  server.registerPrompt(
    'lpza_fee_posting',
    {
      title: 'Post fees to a matter (WIP)',
      description:
        'Workflow to list unbilled WIP on a matter and upsert draft fees with caller-supplied VAT amounts.',
      argsSchema: feePostingArgsSchema,
    },
    ({ matter_id, product_id, salesagent_id }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Post fees or disbursements to matter ${matter_id} in LawPracticeZA.

Follow this workflow:

1. **List current WIP** — call \`lpza_list_unbilled\` with \`matter_id: "${matter_id}"\` to see existing unbilled draft line items.

2. **Confirm firm VAT context** (optional) — read \`lpza://firm\` for \`vatflag\` / \`vatnumber\` if you need registration context. Do not hardcode 14% or 15% VAT.

3. **Upsert draft fees** — for each fee or disbursement, call \`lpza_upsert_draft_fee\` with:
   - \`matter_id\`
   - \`product_id\` (posting code)${product_id ? `: "${product_id}"` : ''}
   - \`salesagent_id\` (fee earner)${salesagent_id ? `: "${salesagent_id}"` : ''}
   - \`unitprice\`, \`tax\`, and \`trantotal\` supplied by the caller (exclusive, VAT, and inclusive totals)
   - optional \`matterdraftlineitem_name\`, \`minutes\`, \`date\`, \`srcid\`, or \`matterdraftlineitem_uid\` to update an existing line

4. **Re-list WIP** — call \`lpza_list_unbilled\` again to verify the draft items.

5. **Advanced** — for API guide methods without a curated tool, use \`lpza_api_call\` (same auth as other tools).

Do not invent trust/investment write helpers. Deleting WIP requires \`lpza_delete_draft_fee\` with \`confirm: true\`.`,
          },
        },
      ],
    }),
  );
}
