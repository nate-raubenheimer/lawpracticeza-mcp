import type { McpServer } from '@modelcontextprotocol/server';

import type { LpzaClient } from '../lpza/client.js';
import { registerFirmResource } from './firm.js';
import { registerSchemaNotesResource } from './schema-notes.js';

export function registerResources(server: McpServer, client?: LpzaClient): void {
  registerFirmResource(server, client);
  registerSchemaNotesResource(server);
}
