import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  LpzaAuthError,
  LpzaClient,
  LpzaServerError,
  LpzaValidationError,
  type FetchFn,
} from '../src/lpza/index.js';

const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(`${fixturesDir}/${name}`, 'utf8'));
}

const loginResponse = readFixture('access-login-response.json') as { token: string };
const statusLoggedIn = readFixture('access-status-logged-in.json');
const statusLoggedOut = readFixture('access-status-logged-out.json');

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
  handlers: Record<string, (req: RecordedRequest, attempt: number) => Response>,
): { fetch: FetchFn; requests: RecordedRequest[]; attempts: Map<string, number> } {
  const requests: RecordedRequest[] = [];
  const attempts = new Map<string, number>();

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

    const attempt = (attempts.get(url) ?? 0) + 1;
    attempts.set(url, attempt);

    const handler = handlers[url];
    if (!handler) {
      return new Response('unknown url', { status: 500 });
    }
    return handler(recorded, attempt);
  };

  return { fetch, requests, attempts };
}

test('buildUrl appends object, method, and positional segments', () => {
  const client = new LpzaClient({
    credentials,
    baseUrl: 'https://lawpracticeza.com/api',
    fetch: async () => new Response('{}', { status: 200 }),
  });

  assert.equal(
    client.buildUrl('company', 'detail', ['only']),
    'https://lawpracticeza.com/api/company/detail/only',
  );
  assert.equal(
    client.buildUrl('access', 'login'),
    'https://lawpracticeza.com/api/access/login',
  );
});

test('login stores token and status sends X-token with form POST body', async () => {
  const base = 'https://lawpracticeza.com/api';
  const loginUrl = `${base}/access/login`;
  const statusUrl = `${base}/access/status`;

  const { fetch, requests } = createMockFetch({
    [loginUrl]: () =>
      new Response(JSON.stringify(loginResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    [statusUrl]: (req) => {
      assert.equal(req.headers['x-token'], loginResponse.token);
      return new Response(JSON.stringify(statusLoggedIn), { status: 200 });
    },
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });
  const token = await client.login();
  assert.equal(token, loginResponse.token);
  assert.equal(client.auth.getToken(), loginResponse.token);

  const status = await client.status();
  assert.equal(status.loggedin, true);
  assert.equal((status as { database: string }).database, 'vuka');

  const loginReq = requests.find((r) => r.url === loginUrl);
  assert.ok(loginReq);
  assert.equal(loginReq.method, 'POST');
  assert.equal(loginReq.headers['content-type'], 'application/x-www-form-urlencoded');
  assert.ok(loginReq.body.includes('database=VUKA'));
  assert.ok(loginReq.body.includes('login_code=apiuser'));
  assert.ok(loginReq.body.includes('password='));
  assert.equal(loginReq.headers['x-token'], undefined);

  const statusReq = requests.find((r) => r.url === statusUrl);
  assert.ok(statusReq);
  assert.equal(statusReq.headers['x-token'], loginResponse.token);
});

test('call posts named params as form fields', async () => {
  const base = 'https://lawpracticeza.com/api';
  const url = `${base}/matterdraftlineitem/create`;

  const { fetch, requests } = createMockFetch({
    [url]: (req) => {
      assert.ok(req.body.includes('customer_id=CUST_1'));
      assert.ok(req.body.includes('qty=1'));
      return new Response('{"matterdraftlineitem_uid":"MDLI_1"}', { status: 200 });
    },
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });
  const result = await client.call<{ matterdraftlineitem_uid: string }>(
    'matterdraftlineitem',
    'create',
    undefined,
    { customer_id: 'CUST_1', qty: '1' },
    { skipAuth: true },
  );

  assert.equal(result.matterdraftlineitem_uid, 'MDLI_1');
  assert.equal(requests[0]?.method, 'POST');
});

test('403 triggers a single re-login then retries the original call', async () => {
  const base = 'https://lawpracticeza.com/api';
  const loginUrl = `${base}/access/login`;
  const statusUrl = `${base}/access/status`;

  let statusCalls = 0;
  let loginCalls = 0;

  const { fetch, requests } = createMockFetch({
    [loginUrl]: () => {
      loginCalls += 1;
      return new Response(JSON.stringify(loginResponse), { status: 200 });
    },
    [statusUrl]: () => {
      statusCalls += 1;
      if (statusCalls === 1) {
        return new Response('session expired', { status: 403 });
      }
      return new Response(JSON.stringify(statusLoggedIn), { status: 200 });
    },
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });
  client.auth.setToken('stale-token');

  const status = await client.status();
  assert.equal(status.loggedin, true);
  assert.equal(loginCalls, 1);
  assert.equal(statusCalls, 2);

  const statusAttempts = requests.filter((r) => r.url === statusUrl);
  assert.equal(statusAttempts.length, 2);
  assert.equal(statusAttempts[0]?.headers['x-token'], 'stale-token');
  assert.equal(statusAttempts[1]?.headers['x-token'], loginResponse.token);
});

test('403 after re-login surfaces LpzaAuthError', async () => {
  const base = 'https://lawpracticeza.com/api';
  const loginUrl = `${base}/access/login`;
  const statusUrl = `${base}/access/status`;

  const { fetch } = createMockFetch({
    [loginUrl]: () =>
      new Response(JSON.stringify(loginResponse), { status: 200 }),
    [statusUrl]: () => new Response('still forbidden', { status: 403 }),
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });
  client.auth.setToken('stale-token');

  await assert.rejects(client.status(), (err: unknown) => {
    assert.ok(err instanceof LpzaAuthError);
    assert.equal(err.responseBody, 'still forbidden');
    return true;
  });
});

test('406 and 500 surface structured errors with response body text', async () => {
  const base = 'https://lawpracticeza.com/api';
  const validationUrl = `${base}/customer/create`;
  const serverUrl = `${base}/customer/list`;

  const { fetch } = createMockFetch({
    [validationUrl]: () =>
      new Response('customer_code is required', { status: 406 }),
    [serverUrl]: () => new Response('unhandled exception', { status: 500 }),
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });

  await assert.rejects(
    client.call('customer', 'create', undefined, {}, { skipAuth: true }),
    (err: unknown) => {
      assert.ok(err instanceof LpzaValidationError);
      assert.equal(err.responseBody, 'customer_code is required');
      return true;
    },
  );

  await assert.rejects(
    client.call('customer', 'list', undefined, {}, { skipAuth: true }),
    (err: unknown) => {
      assert.ok(err instanceof LpzaServerError);
      assert.equal(err.responseBody, 'unhandled exception');
      return true;
    },
  );
});

test('status logged-out fixture parses', async () => {
  const base = 'https://lawpracticeza.com/api';
  const statusUrl = `${base}/access/status`;

  const { fetch } = createMockFetch({
    [statusUrl]: () =>
      new Response(JSON.stringify(statusLoggedOut), { status: 200 }),
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });
  const status = await client.status();
  assert.equal(status.loggedin, false);
  assert.equal(status.database, null);
});

test('requests and errors never include credentials or tokens in thrown messages', async () => {
  const base = 'https://lawpracticeza.com/api';
  const loginUrl = `${base}/access/login`;

  const { fetch } = createMockFetch({
    [loginUrl]: () => new Response('bad credentials', { status: 403 }),
  });

  const client = new LpzaClient({ credentials, baseUrl: base, fetch });

  await assert.rejects(client.login(), (err: unknown) => {
    assert.ok(err instanceof LpzaAuthError);
    assert.equal(err.message, 'LawPracticeZA authentication error');
    assert.ok(!err.message.includes(credentials.password));
    assert.ok(!err.message.includes(credentials.loginCode));
    assert.equal(err.responseBody, 'bad credentials');
    return true;
  });
});
