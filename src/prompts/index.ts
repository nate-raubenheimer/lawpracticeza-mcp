import type { McpServer } from '@modelcontextprotocol/server';

import { registerFeePostingPrompt } from './fee-posting.js';
import { registerInvoiceMatterPrompt } from './invoice-matter.js';

export function registerPrompts(server: McpServer): void {
  registerFeePostingPrompt(server);
  registerInvoiceMatterPrompt(server);
}
