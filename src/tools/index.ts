import type { McpServer } from '@modelcontextprotocol/server';

import type { LpzaClient } from '../lpza/client.js';
import { createClientFromEnv } from './common.js';
import { registerCreateClientTool } from './create-client.js';
import { registerCreateMatterTool } from './create-matter.js';
import { registerCreateTransferTool } from './create-transfer.js';
import { registerDeleteDraftFeeTool } from './delete-draft-fee.js';
import { registerListUnbilledTool } from './list-unbilled.js';
import { registerPingTool } from './ping.js';
import { registerReadTools } from './read/index.js';
import { registerUpdateMatterTool } from './update-matter.js';
import { registerUpsertDraftFeeTool } from './upsert-draft-fee.js';

/**
 * Register MCP tools. When `client` is omitted, tools attempt to build an
 * `LpzaClient` from env at call time.
 */
export function registerTools(server: McpServer, client?: LpzaClient): void {
  const getClient = () => client ?? createClientFromEnv();

  registerPingTool(server);
  registerReadTools(server, { getClient });
  registerCreateClientTool(server, client);
  registerCreateMatterTool(server, client);
  registerUpdateMatterTool(server, client);
  registerCreateTransferTool(server, client);
  registerListUnbilledTool(server, client);
  registerUpsertDraftFeeTool(server, client);
  registerDeleteDraftFeeTool(server, client);
}

/** @deprecated Use registerTools */
export function registerPlaceholderTools(server: McpServer): void {
  registerTools(server);
}
