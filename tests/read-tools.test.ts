import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport, McpServer } from '@modelcontextprotocol/server';

import { LpzaClient, type FetchFn } from '../src/lpza/index.js';
import { registerReadTools } from '../src/tools/read/index.js';

const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(`${fixturesDir}/${name}`, 'utf8'));
}

const credentials = {
  database: 'VUKA',
  loginCode: 'apiuser',
  password: 'test-password-not-real',
};

const base = 'https://lawpracticeza.com/api';
const loginResponse = readFixture('access-login-response.json') as { token: string };
const statusLoggedIn = readFixture('access-status-logged-in.json');
const companyDetail = readFixture('company-detail-only.json');
const matterStatement2 = readFixture('matter-statement2.json');
const matterStatement3 = readFixture('matter-statement3.json');

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

function defaultHandlers(): Record<string, (req: RecordedRequest) => Response> {
  return {
    [`${base}/access/login`]: () =>
      new Response(JSON.stringify(loginResponse), { status: 200 }),
    [`${base}/access/status`]: () =>
      new Response(JSON.stringify(statusLoggedIn), { status: 200 }),
    [`${base}/company/detail/only`]: () =>
      new Response(JSON.stringify(companyDetail), { status: 200 }),
    [`${base}/department/list`]: () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    [`${base}/department/listforselection`]: () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    [`${base}/salesagent/list`]: () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    [`${base}/product/list`]: () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    [`${base}/customer/list`]: () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    [`${base}/customer/detail/CUST_1`]: () =>
      new Response(JSON.stringify({ data: { customer_id: 'CUST_1' } }), {
        status: 200,
      }),
    [`${base}/matter/list`]: () =>
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    [`${base}/matter/detail/MTR_1`]: (req) => {
      assert.ok(req.body.includes('lookup='));
      return new Response(JSON.stringify({ data: { matter_id: 'MTR_1' } }), {
        status: 200,
      });
    },
    [`${base}/matter/balances/MTR_1`]: () =>
      new Response(JSON.stringify({}), { status: 200 }),
    [`${base}/matter/statement2/MTR_1`]: () =>
      new Response(JSON.stringify(matterStatement2), { status: 200 }),
    [`${base}/matter/statement3/MTR_1`]: () =>
      new Response(JSON.stringify(matterStatement3), { status: 200 }),
  };
}

async function createTestClient(
  handlers = defaultHandlers(),
): Promise<{ client: Client; requests: RecordedRequest[] }> {
  const { fetch, requests } = createMockFetch(handlers);
  const lpzaClient = new LpzaClient({ credentials, baseUrl: base, fetch });
  await lpzaClient.login();

  const server = new McpServer({ name: 'test', version: '0.0.0' });
  registerReadTools(server, { getClient: () => lpzaClient });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: 'read-tools-test', version: '0.0.0' });
  await client.connect(clientTransport);

  return { client, requests };
}

function parseToolText(result: { content: unknown[] }): unknown {
  const text = result.content
    .filter((block): block is { type: 'text'; text: string } =>
      typeof block === 'object' &&
      block !== null &&
      'type' in block &&
      block.type === 'text' &&
      'text' in block,
    )
    .map((block) => block.text)
    .join('');
  return JSON.parse(text);
}

let client: Client;

before(async () => {
  ({ client } = await createTestClient());
});

after(async () => {
  await client.close();
});

test('read tools are registered', async () => {
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, [
    'lpza_firm_details',
    'lpza_get_client',
    'lpza_get_matter',
    'lpza_list_clients',
    'lpza_list_departments',
    'lpza_list_fee_earners',
    'lpza_list_matters',
    'lpza_list_posting_codes',
    'lpza_matter_balances',
    'lpza_matter_business_entries',
    'lpza_matter_statement',
    'lpza_status',
  ]);
});

test('lpza_status returns access.status fixture', async () => {
  const result = await client.callTool({ name: 'lpza_status', arguments: {} });
  const body = parseToolText(result) as { loggedin: boolean; database: string };
  assert.equal(body.loggedin, true);
  assert.equal(body.database, 'vuka');
});

test('lpza_firm_details returns company.detail/only fixture', async () => {
  const result = await client.callTool({
    name: 'lpza_firm_details',
    arguments: {},
  });
  const body = parseToolText(result) as {
    data: { company_name: string; vatflag: string };
  };
  assert.equal(body.data.company_name, 'VUKA');
  assert.equal(body.data.vatflag, 'E');
});

test('lookup list tools call documented /api/{object}/list endpoints', async () => {
  const { client: listClient, requests } = await createTestClient();
  try {
    await listClient.callTool({
      name: 'lpza_list_departments',
      arguments: {},
    });
    await listClient.callTool({
      name: 'lpza_list_fee_earners',
      arguments: {},
    });
    await listClient.callTool({
      name: 'lpza_list_posting_codes',
      arguments: {},
    });

    const urls = requests.map((r) => r.url);
    assert.ok(urls.includes(`${base}/department/list`));
    assert.ok(urls.includes(`${base}/salesagent/list`));
    assert.ok(urls.includes(`${base}/product/list`));
  } finally {
    await listClient.close();
  }
});

test('lpza_list_departments can call listforselection', async () => {
  const { client: deptClient, requests } = await createTestClient();
  try {
    await deptClient.callTool({
      name: 'lpza_list_departments',
      arguments: { for_selection: true },
    });
    assert.ok(
      requests.some((r) => r.url === `${base}/department/listforselection`),
    );
  } finally {
    await deptClient.close();
  }
});

test('lpza_get_matter passes lookup="" for raw foreign keys', async () => {
  const { client: matterClient, requests } = await createTestClient();
  try {
    await matterClient.callTool({
      name: 'lpza_get_matter',
      arguments: { matter_id: 'MTR_1', lookup: '' },
    });
    const detailReq = requests.find(
      (r) => r.url === `${base}/matter/detail/MTR_1`,
    );
    assert.ok(detailReq);
    assert.ok(detailReq.body.includes('lookup='));
  } finally {
    await matterClient.close();
  }
});

test('lpza_matter_balances calls matter.balances/{matter_id}', async () => {
  const { client: balanceClient, requests } = await createTestClient();
  try {
    const result = await balanceClient.callTool({
      name: 'lpza_matter_balances',
      arguments: { matter_id: 'MTR_1' },
    });
    assert.equal(result.isError, undefined);
    assert.ok(
      requests.some((r) => r.url === `${base}/matter/balances/MTR_1`),
    );
  } finally {
    await balanceClient.close();
  }
});

test('lpza_matter_statement returns statement2 fixture shape', async () => {
  const result = await client.callTool({
    name: 'lpza_matter_statement',
    arguments: { matter_id: 'MTR_1' },
  });
  const body = parseToolText(result) as {
    company: { company_name: string };
    matters: Array<{ T: { rows: unknown[] } }>;
  };
  assert.equal(body.company.company_name, 'VUKA');
  assert.ok((body.matters[0]?.T?.rows.length ?? 0) > 0);
});

test('lpza_matter_business_entries returns statement3 fixture', async () => {
  const result = await client.callTool({
    name: 'lpza_matter_business_entries',
    arguments: { matter_id: 'MTR_1' },
  });
  const body = parseToolText(result) as {
    data: Array<{ reference: string; bticode: string }>;
  };
  assert.equal(body.data[0]?.reference, 'INV1002');
  assert.equal(body.data[0]?.bticode, 'B');
});

test('read tools without credentials return credentials_missing', async () => {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  registerReadTools(server, { getClient: () => undefined });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const noCredClient = new Client({ name: 'no-cred-test', version: '0.0.0' });
  await noCredClient.connect(clientTransport);

  try {
    const result = await noCredClient.callTool({
      name: 'lpza_status',
      arguments: {},
    });
    assert.equal(result.isError, true);
    const body = parseToolText(result) as { error: string };
    assert.equal(body.error, 'credentials_missing');
  } finally {
    await noCredClient.close();
  }
});
