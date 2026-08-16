import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { LpzaClient } from '../lpza/client.js';
import {
  createClientFromEnv,
  jsonToolResult,
  missingClientError,
} from './common.js';

const apiCallInputSchema = z.object({
  object: z.string().describe('LawPracticeZA API object (e.g. customer, matter).'),
  method: z.string().describe('API method (e.g. insert, detail, childlist).'),
  positional: z
    .array(z.string())
    .optional()
    .describe('Optional URL path segments after object/method.'),
  params: z
    .record(z.string(), z.string())
    .optional()
    .describe('Optional form-urlencoded POST body parameters.'),
});

export type ApiCallInput = z.infer<typeof apiCallInputSchema>;

/**
 * Advanced escape hatch: call any documented or undocumented object/method pair
 * through the shared LpzaClient (auth, errors, form POST). Caller is responsible
 * for parameters, VAT amounts, and side effects including trust writes.
 */
export async function apiCall(
  client: LpzaClient,
  input: ApiCallInput,
): Promise<unknown> {
  return client.call(
    input.object,
    input.method,
    input.positional,
    input.params,
  );
}

export function registerApiCallTool(
  server: McpServer,
  client?: LpzaClient,
): void {
  const lpza = client ?? createClientFromEnv();

  server.registerTool(
    'lpza_api_call',
    {
      description:
        'Advanced: call any LawPracticeZA object/method through LpzaClient (same auth and errors as curated tools). Use for API guide methods not yet wrapped, or undocumented pairs — you supply object, method, optional positional URL segments, and optional form params. There are no curated trust/investment write helpers; raw calls are explicit and caller-supplied. Do not hardcode VAT rates.',
      inputSchema: apiCallInputSchema,
    },
    async (input) => {
      if (!lpza) {
        return missingClientError();
      }
      const result = await apiCall(lpza, input);
      return jsonToolResult(result);
    },
  );
}
