import type { McpServer } from '@modelcontextprotocol/server';

import { registerAccountingTools } from './accounting.js';
import { registerClientTools } from './clients.js';
import { registerFirmTool } from './firm.js';
import { registerLookupTools } from './lookups.js';
import { registerMatterTools } from './matters.js';
import { registerStatusTool } from './status.js';
import type { ReadToolsDeps } from '../context.js';
import { defaultReadToolsDeps } from '../context.js';

export { defaultReadToolsDeps, type ReadToolsDeps } from '../context.js';

/** Register curated LawPracticeZA read MCP tools (APP-132). */
export function registerReadTools(
  server: McpServer,
  deps: ReadToolsDeps = defaultReadToolsDeps(),
): void {
  registerStatusTool(server, deps);
  registerFirmTool(server, deps);
  registerLookupTools(server, deps);
  registerClientTools(server, deps);
  registerMatterTools(server, deps);
  registerAccountingTools(server, deps);
}
