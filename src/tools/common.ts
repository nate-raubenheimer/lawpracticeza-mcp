import { LpzaClient } from '../lpza/client.js';
import { credentialsFromEnv, DEFAULT_LPZA_BASE_URL } from '../lpza/index.js';

/** Build an `LpzaClient` from env when credentials are configured. */
export function createClientFromEnv(): LpzaClient | undefined {
  const credentials = credentialsFromEnv();
  if (!credentials) {
    return undefined;
  }
  const baseUrl = process.env.LPZA_BASE_URL ?? DEFAULT_LPZA_BASE_URL;
  return new LpzaClient({ credentials, baseUrl });
}

export function missingClientError(): {
  isError: true;
  content: [{ type: 'text'; text: string }];
} {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error:
            'LawPracticeZA credentials are not configured. Set LPZA_DATABASE, LPZA_LOGIN_CODE, and LPZA_PASSWORD.',
        }),
      },
    ],
  };
}

export function confirmRequiredError(action: string): {
  isError: true;
  content: [{ type: 'text'; text: string }];
} {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          error: `Refused: set confirm: true to ${action}.`,
        }),
      },
    ],
  };
}

/** Convert a record to form-urlencoded string fields (omit null/undefined). */
export function recordToFormParams(
  record: Record<string, unknown>,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) {
      continue;
    }
    params[key] = String(value);
  }
  return params;
}

export function jsonToolResult(data: unknown): {
  content: [{ type: 'text'; text: string }];
} {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
  };
}

/** LawPracticeZA web UI base for sales invoice links (not the API base URL). */
export const LPZA_SALESINVOICE_WEB_BASE =
  'https://lawpracticeza.com/salesinvoice';

/** Build detail and PDF URLs for a sales invoice uid per the API guide. */
export function salesInvoiceUrls(uid: string): {
  salesinvoice_detail_url: string;
  salesinvoice_pdf_url: string;
} {
  return {
    salesinvoice_detail_url: `${LPZA_SALESINVOICE_WEB_BASE}/detail/${uid}`,
    salesinvoice_pdf_url: `${LPZA_SALESINVOICE_WEB_BASE}/servepdf/${uid}`,
  };
}
