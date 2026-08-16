import type { McpServer } from '@modelcontextprotocol/server';

import { textResourceResult } from './common.js';

export const SCHEMA_NOTES_RESOURCE_URI = 'lpza://schema-notes';

const SCHEMA_NOTES = `# LawPracticeZA schema notes

This MCP server wraps a subset of the [LawPracticeZA REST API](https://lawpracticeza.com/docs/api_guide.html). The official guide is incomplete; use \`lpza_api_call\` for undocumented \`object\`/\`method\` pairs.

## Public documentation

- API guide: https://lawpracticeza.com/docs/api_guide.html
- Schema reference: https://lawpracticeza.com/docs/schema.html

## Request shape

All calls are \`POST\` with \`application/x-www-form-urlencoded\` bodies to:

\`{LPZA_BASE_URL}/{object}/{method}/{positional…}\`

Session auth uses \`access.login\` and the \`X-token\` header on subsequent calls.

## Curated tools in this server

| Tool | API |
| --- | --- |
| \`lpza_create_client\` | \`customer.insert\` |
| \`lpza_create_matter\` | \`matter.insert\` |
| \`lpza_update_matter\` | \`matter.detail\` + \`matter.update\` |
| \`lpza_create_transfer\` | \`matterset.createtransfer\` |
| \`lpza_list_unbilled\` | \`matterdraftlineitem.childlist\` |
| \`lpza_upsert_draft_fee\` | \`matterdraftlineitem.upsert\` |
| \`lpza_delete_draft_fee\` | \`matterdraftlineitem.quickdelete\` |

## VAT and amounts

Do not hardcode 14% or 15% VAT. Callers supply \`unitprice\`, \`tax\`, and \`trantotal\` on fee writes.

## Trust and investment writes

Trust/investment **write** helpers are not curated here unless the official guide documents them. Reads such as \`statement2\` / \`balances\` may be called via \`lpza_api_call\` when needed.

## Firm resource

\`lpza://firm\` returns \`company.detail\` with positional \`only\` (one firm per database).
`;

export function registerSchemaNotesResource(server: McpServer): void {
  server.registerResource(
    'schema-notes',
    SCHEMA_NOTES_RESOURCE_URI,
    {
      title: 'LawPracticeZA schema notes',
      description:
        'Pointers to the public API guide and schema, plus how this MCP server maps curated tools.',
      mimeType: 'text/markdown',
    },
    async (uri) => textResourceResult(uri, SCHEMA_NOTES),
  );
}
