import type { CallToolResult } from '@modelcontextprotocol/server';

import { credentialsFromEnv } from '../lpza/auth.js';
import {
  DEFAULT_LPZA_BASE_URL,
  LpzaClient,
  type FetchFn,
} from '../lpza/client.js';
import { LpzaError } from '../lpza/errors.js';

export interface ReadToolsDeps {
  getClient: () => LpzaClient | undefined;
}

/** Build an `LpzaClient` from environment variables, or undefined if credentials are missing. */
export function createClientFromEnv(fetch?: FetchFn): LpzaClient | undefined {
  const credentials = credentialsFromEnv();
  if (!credentials) {
    return undefined;
  }

  const baseUrl = process.env.LPZA_BASE_URL ?? DEFAULT_LPZA_BASE_URL;
  return new LpzaClient({ credentials, baseUrl, fetch });
}

export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function credentialsMissingResult(): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: 'credentials_missing',
            message:
              'LawPracticeZA credentials are not configured. Set LPZA_DATABASE, LPZA_LOGIN_CODE, and LPZA_PASSWORD.',
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

export function lpzaErrorResult(err: LpzaError): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: err.name,
            statusCode: err.statusCode,
            message: err.message,
            responseBody: err.responseBody,
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

export function unknownErrorResult(err: unknown): CallToolResult {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: 'unknown_error', message }, null, 2),
      },
    ],
    isError: true,
  };
}

/** Run an LPZA call with credential and error handling shared by read tools. */
export async function withLpzaClient<T>(
  getClient: () => LpzaClient | undefined,
  fn: (client: LpzaClient) => Promise<T>,
): Promise<CallToolResult> {
  const client = getClient();
  if (!client) {
    return credentialsMissingResult();
  }

  try {
    const data = await fn(client);
    return jsonResult(data);
  } catch (err) {
    if (err instanceof LpzaError) {
      return lpzaErrorResult(err);
    }
    return unknownErrorResult(err);
  }
}

export function defaultReadToolsDeps(): ReadToolsDeps {
  return { getClient: () => createClientFromEnv() };
}
