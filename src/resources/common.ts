import type { ReadResourceResult } from '@modelcontextprotocol/server';

export function missingClientResourceResult(uri: URL): ReadResourceResult {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({
          error:
            'LawPracticeZA credentials are not configured. Set LPZA_DATABASE, LPZA_LOGIN_CODE, and LPZA_PASSWORD.',
        }),
      },
    ],
  };
}

export function jsonResourceResult(uri: URL, data: unknown): ReadResourceResult {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function textResourceResult(
  uri: URL,
  text: string,
  mimeType = 'text/markdown',
): ReadResourceResult {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType,
        text,
      },
    ],
  };
}
