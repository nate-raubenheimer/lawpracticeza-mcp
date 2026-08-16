import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { LpzaClient, type FetchFn } from '../src/lpza/index.js';
import { readFirmResource } from '../src/resources/firm.js';
import { SCHEMA_NOTES_RESOURCE_URI } from '../src/resources/schema-notes.js';
import { apiCall } from '../src/tools/api-call.js';

const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));
const base = 'https://lawpracticeza.com/api';

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(`${fixturesDir}/${name}`, 'utf8'));
}

const companyDetailResponse = readFixture('company-detail-response.json');

const credentials = {
  database: 'VUKA',
  loginCode: 'apiuser',
  password: 'test-password-not-real',
};

interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

function createMockFetch(
  handlers: Record<string, (req: RecordedRequest) => Response>,
): { fetch: FetchFn; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];

  const fetch: FetchFn = async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method = init?.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const raw = init.headers;
      if (raw instanceof Headers) {
        raw.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
      } else if (Array.isArray(raw)) {
        for (const [key, value] of raw) {
          headers[key.toLowerCase()] = value;
        }
      } else {
        for (const [key, value] of Object.entries(raw)) {
          if (value !== undefined) {
            headers[key.toLowerCase()] = value;
          }
        }
      }
    }
    const body = typeof init?.body === 'string' ? init.body : '';
    const recorded: RecordedRequest = { url, method, headers, body };
    requests.push(recorded);

    const handler = handlers[url];
    if (!handler) {
      return new Response(`unknown url: ${url}`, { status: 500 });
    }
    return handler(recorded);
  };

  return { fetch, requests };
}

function createTestClient(
  handlers: Record<string, (req: RecordedRequest) => Response>,
): { client: LpzaClient; requests: RecordedRequest[] } {
  const { fetch, requests } = createMockFetch(handlers);
  const client = new LpzaClient({ credentials, baseUrl: base, fetch });
  return { client, requests };
}

test('lpza_api_call delegates to LpzaClient.call with positional and params', async () => {
  const detailUrl = `${base}/company/detail/only`;
  const { client, requests } = createTestClient({
    [detailUrl]: (req) => {
      assert.equal(req.method, 'POST');
      assert.equal(req.body, '');
      return new Response(JSON.stringify(companyDetailResponse), { status: 200 });
    },
  });

  const result = await apiCall(client, {
    object: 'company',
    method: 'detail',
    positional: ['only'],
  });

  assert.deepEqual(result, companyDetailResponse);
  assert.equal(requests[0]?.url, detailUrl);
});

test('lpza_api_call passes form params on the POST body', async () => {
  const billUrl = `${base}/matter/bill/MTR_TEST_1`;
  const { client, requests } = createTestClient({
    [billUrl]: (req) => {
      assert.ok(req.body.includes('all=1'));
      return new Response(
        JSON.stringify({ what: 'salesinvoice', uid: 'SI__API_1_5797205714080' }),
        { status: 200 },
      );
    },
  });

  const result = await apiCall(client, {
    object: 'matter',
    method: 'bill',
    positional: ['MTR_TEST_1'],
    params: { all: '1' },
  });

  assert.deepEqual(result, {
    what: 'salesinvoice',
    uid: 'SI__API_1_5797205714080',
  });
  assert.equal(requests[0]?.url, billUrl);
});

test('lpza://firm resource reads company.detail/only', async () => {
  const detailUrl = `${base}/company/detail/only`;
  const { client } = createTestClient({
    [detailUrl]: () =>
      new Response(JSON.stringify(companyDetailResponse), { status: 200 }),
  });

  const uri = new URL('lpza://firm');
  const result = await readFirmResource(client, uri);

  assert.equal(result.contents[0]?.uri, 'lpza://firm');
  assert.equal(result.contents[0]?.mimeType, 'application/json');
  const textBlock = result.contents[0];
  assert.ok(textBlock && 'text' in textBlock);
  const body = JSON.parse(textBlock.text);
  assert.deepEqual(body, companyDetailResponse);
});

test('lpza://firm without credentials returns configuration error', async () => {
  const uri = new URL('lpza://firm');
  const result = await readFirmResource(undefined, uri);
  const textBlock = result.contents[0];
  assert.ok(textBlock && 'text' in textBlock);
  const body = JSON.parse(textBlock.text) as { error: string };

  assert.match(body.error, /credentials are not configured/);
});

test('schema notes resource URI is stable', () => {
  assert.equal(SCHEMA_NOTES_RESOURCE_URI, 'lpza://schema-notes');
});
