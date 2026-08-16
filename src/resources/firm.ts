import type { McpServer } from '@modelcontextprotocol/server';

import type { LpzaClient } from '../lpza/client.js';
import { createClientFromEnv } from '../tools/common.js';
import {
  jsonResourceResult,
  missingClientResourceResult,
} from './common.js';

export const FIRM_RESOURCE_URI = 'lpza://firm';

export async function readFirmResource(
  client: LpzaClient | undefined,
  uri: URL,
): Promise<ReturnType<typeof jsonResourceResult>> {
  if (!client) {
    return missingClientResourceResult(uri);
  }

  const data = await client.call('company', 'detail', ['only']);
  return jsonResourceResult(uri, data);
}

export function registerFirmResource(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerResource(
    'firm',
    FIRM_RESOURCE_URI,
    {
      title: 'Law firm details',
      description:
        'Company (firm) detail from company.detail/only — VAT flag, name, contact info.',
      mimeType: 'application/json',
    },
    async (uri) => readFirmResource(lpza, uri),
  );
}
