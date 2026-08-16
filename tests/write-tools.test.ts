import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { LpzaClient, type FetchFn } from '../src/lpza/index.js';
import { createClient } from '../src/tools/create-client.js';
import { createMatter } from '../src/tools/create-matter.js';
import { createTransfer } from '../src/tools/create-transfer.js';
import { billMatter, handleBillMatter } from '../src/tools/bill-matter.js';
import { deleteDraftFee, handleDeleteDraftFee } from '../src/tools/delete-draft-fee.js';
import { listUnbilled } from '../src/tools/list-unbilled.js';
import { handleSendInvoice, sendInvoice } from '../src/tools/send-invoice.js';
import { updateMatter } from '../src/tools/update-matter.js';
import { upsertDraftFee } from '../src/tools/upsert-draft-fee.js';

const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));
const base = 'https://lawpracticeza.com/api';

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(`${fixturesDir}/${name}`, 'utf8'));
}

const customerInsertResponse = readFixture('customer-insert-response.json');
const matterInsertResponse = readFixture('matter-insert-response.json');
const matterDetailResponse = readFixture('matter-detail-response.json');
const matterUpdateResponse = readFixture('matter-update-response.json');
const createTransferResponse = readFixture('matterset-createtransfer-response.json');
const childListResponse = readFixture('matterdraftlineitem-childlist-response.json');
const upsertResponse = readFixture('matterdraftlineitem-upsert-response.json');
const quickDeleteResponse = readFixture('matterdraftlineitem-quickdelete-response.json');
const billItemsResponse = readFixture('matter-bill-items-response.json');
const billAllResponse = readFixture('matter-bill-all-response.json');
const sendInvoiceResponse = readFixture('salesinvoice-send-response.json');

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

test('lpza_create_client maps to customer.insert with fixture response', async () => {
  const insertUrl = `${base}/customer/insert`;
  const { client, requests } = createTestClient({
    [insertUrl]: (req) => {
      assert.ok(req.body.includes('customer_name=ACME+Enterprises'));
      assert.ok(req.body.includes('customer_code=ACME100'));
      assert.ok(req.body.includes('department_id=DEPT__SYS_1_24294194765458'));
      return new Response(JSON.stringify(customerInsertResponse), { status: 200 });
    },
  });

  const result = await createClient(client, {
    customer_name: 'ACME Enterprises',
    customer_code: 'ACME100',
    department_id: 'DEPT__SYS_1_24294194765458',
  });

  assert.deepEqual(result, customerInsertResponse);
  assert.equal(requests[0]?.url, insertUrl);
});

test('lpza_create_matter maps to matter.insert with fixture response', async () => {
  const insertUrl = `${base}/matter/insert`;
  const { client } = createTestClient({
    [insertUrl]: (req) => {
      assert.ok(req.body.includes('matter_name='));
      assert.ok(req.body.includes('matter_code=ACM%2F2109%2F120'));
      assert.ok(req.body.includes('customer_id=CUST_API_1_39321029271287'));
      assert.ok(req.body.includes('owner_salesagent_id=SA__SYS_1_12291091625556'));
      assert.ok(req.body.includes('dateopened=2017-11-13'));
      return new Response(JSON.stringify(matterInsertResponse), { status: 200 });
    },
  });

  const result = await createMatter(client, {
    matter_name: 'Sale of 23 Firdale Road (ERF 27)',
    matter_code: 'ACM/2109/120',
    customer_id: 'CUST_API_1_39321029271287',
    owner_salesagent_id: 'SA__SYS_1_12291091625556',
    dateopened: '2017-11-13',
  });

  assert.deepEqual(result, matterInsertResponse);
});

test('lpza_update_matter fetches detail with lookup="" then posts full record', async () => {
  const matterId = 'MTR_SYS_1_76799379571032';
  const detailUrl = `${base}/matter/detail/${matterId}`;
  const updateUrl = `${base}/matter/update`;

  const { client, requests } = createTestClient({
    [detailUrl]: (req) => {
      assert.ok(req.body.includes('lookup='));
      return new Response(JSON.stringify(matterDetailResponse), { status: 200 });
    },
    [updateUrl]: (req) => {
      assert.ok(req.body.includes('matter_id=MTR_SYS_1_76799379571032'));
      assert.ok(req.body.includes('matter_name=Driving+under+the+influence'));
      assert.ok(req.body.includes('matter_code=MTR%2F001'));
      assert.ok(req.body.includes('customer_id=CUST_API_1_39321029271287'));
      assert.ok(req.body.includes('login_uid=LGN_SYS_1_20713181404328'));
      assert.ok(req.body.includes('rev=0'));
      return new Response(JSON.stringify(matterUpdateResponse), { status: 200 });
    },
  });

  const result = await updateMatter(client, {
    matter_id: matterId,
    matter_name: 'Driving under the influence',
  });

  assert.deepEqual(result, matterUpdateResponse);
  assert.equal(requests.length, 2);
  assert.equal(requests[0]?.url, detailUrl);
  assert.equal(requests[1]?.url, updateUrl);
});

test('lpza_create_transfer maps to matterset.createtransfer with fixture response', async () => {
  const url = `${base}/matterset/createtransfer`;
  const { client } = createTestClient({
    [url]: (req) => {
      assert.ok(req.body.includes('buyer_customer_id=CUST_SYS_1_77118312361113'));
      assert.ok(req.body.includes('seller_customer_id=CUST_SYS_1_33385024356314'));
      assert.ok(req.body.includes('matterset_name=Transfer+of+B0123'));
      return new Response(JSON.stringify(createTransferResponse), { status: 200 });
    },
  });

  const result = await createTransfer(client, {
    buyer_customer_id: 'CUST_SYS_1_77118312361113',
    buyer_owner_salesagent_id: 'SA__SYS_1_12291091625556',
    buyer_matter_code: 'BO123',
    buyer_matter_name: 'Purchase of B0123',
    seller_customer_id: 'CUST_SYS_1_33385024356314',
    seller_owner_salesagent_id: 'SA__SYS_1_12291091625556',
    seller_matter_code: 'S0123',
    seller_matter_name: 'Sale of S0123',
    matterset_name: 'Transfer of B0123',
  });

  assert.deepEqual(result, createTransferResponse);
});

test('lpza_list_unbilled maps to matterdraftlineitem.childlist with fixture response', async () => {
  const matterId = 'MTR_API_1_61355827191366';
  const url = `${base}/matterdraftlineitem/childlist/matter/${matterId}`;
  const { client } = createTestClient({
    [url]: () =>
      new Response(JSON.stringify(childListResponse), { status: 200 }),
  });

  const result = await listUnbilled(client, { matter_id: matterId });
  assert.deepEqual(result, childListResponse);
});

test('lpza_upsert_draft_fee passes caller-supplied tax and trantotal without VAT math', async () => {
  const url = `${base}/matterdraftlineitem/upsert`;
  const { client } = createTestClient({
    [url]: (req) => {
      assert.ok(req.body.includes('unitprice=4600'));
      assert.ok(req.body.includes('tax=644'));
      assert.ok(req.body.includes('trantotal=5244'));
      assert.ok(!req.body.includes('0.14'));
      assert.ok(!req.body.includes('0.15'));
      return new Response(JSON.stringify(upsertResponse), { status: 200 });
    },
  });

  const result = await upsertDraftFee(client, {
    matter_id: 'MTR_API_1_61355827191366',
    product_id: 'PROD_SYS_1_94741331371456',
    salesagent_id: 'SA__SYS_1_12291091625556',
    unitprice: 4600,
    tax: 644,
    trantotal: 5244,
    matterdraftlineitem_name: 'Registration of Mortgage Bond',
  });

  assert.deepEqual(result, upsertResponse);
});

test('lpza_upsert_draft_fee supports update by srcid', async () => {
  const url = `${base}/matterdraftlineitem/upsert`;
  const { client } = createTestClient({
    [url]: (req) => {
      assert.ok(req.body.includes('srcid=67424'));
      assert.ok(req.body.includes('unitprice=100'));
      return new Response(JSON.stringify(upsertResponse), { status: 200 });
    },
  });

  await upsertDraftFee(client, {
    matter_id: 'MTR_API_1_61355827191366',
    product_id: 'PROD_SYS_1_94741331371456',
    salesagent_id: 'SA__SYS_1_12291091625556',
    unitprice: 100,
    tax: 15,
    trantotal: 115,
    srcid: '67424',
  });
});

test('lpza_delete_draft_fee deletes by srcid with fixture response', async () => {
  const url = `${base}/matterdraftlineitem/quickdelete`;
  const { client } = createTestClient({
    [url]: (req) => {
      assert.ok(req.body.includes('srcid=67424'));
      return new Response(JSON.stringify(quickDeleteResponse), { status: 200 });
    },
  });

  const result = await deleteDraftFee(client, {
    srcid: '67424',
  });

  assert.deepEqual(result, quickDeleteResponse);
});

test('lpza_delete_draft_fee deletes by uid in URL path', async () => {
  const uid = '13';
  const url = `${base}/matterdraftlineitem/quickdelete/${uid}`;
  const { client } = createTestClient({
    [url]: () =>
      new Response(JSON.stringify(quickDeleteResponse), { status: 200 }),
  });

  const result = await deleteDraftFee(client, {
    matterdraftlineitem_uid: uid,
  });

  assert.deepEqual(result, quickDeleteResponse);
});

test('lpza_delete_draft_fee refuses without confirm: true', async () => {
  const { client } = createTestClient({});
  const result = await handleDeleteDraftFee(client, {
    confirm: false,
    srcid: '67424',
  });
  assert.ok('isError' in result && result.isError === true);
  const body = JSON.parse(result.content[0]?.text ?? '{}') as { error: string };
  assert.match(body.error, /confirm: true/);
});

test('lpza_bill_matter bills specific items with fixture response and invoice URLs', async () => {
  const matterId = 'MTR_API_1_61355827191366';
  const url = `${base}/matter/bill/${matterId}`;
  const { client } = createTestClient({
    [url]: (req) => {
      assert.ok(req.body.includes('matterdraftlineitems=%5B%2213%22%5D'));
      return new Response(JSON.stringify(billItemsResponse), { status: 200 });
    },
  });

  const result = await billMatter(client, {
    matter_id: matterId,
    matterdraftlineitems: '["13"]',
  });

  assert.equal(result.what, 'salesinvoice');
  assert.equal(result.uid, 'SI__API_1_5797205714080');
  assert.equal(
    result.salesinvoice_detail_url,
    'https://lawpracticeza.com/salesinvoice/detail/SI__API_1_5797205714080',
  );
  assert.equal(
    result.salesinvoice_pdf_url,
    'https://lawpracticeza.com/salesinvoice/servepdf/SI__API_1_5797205714080',
  );
});

test('lpza_bill_matter bills all unbilled items with all=1', async () => {
  const matterId = 'MTR_API_1_61355827191366';
  const url = `${base}/matter/bill/${matterId}`;
  const { client } = createTestClient({
    [url]: (req) => {
      assert.ok(req.body.includes('all=1'));
      return new Response(JSON.stringify(billAllResponse), { status: 200 });
    },
  });

  const result = await billMatter(client, {
    matter_id: matterId,
    all: true,
  });

  assert.equal(result.uid, 'SI__ADM_1_13587111593649');
  assert.ok(result.salesinvoice_detail_url.includes(result.uid));
  assert.ok(result.salesinvoice_pdf_url.includes(result.uid));
});

test('lpza_bill_matter refuses without confirm: true', async () => {
  const { client } = createTestClient({});
  const result = await handleBillMatter(client, {
    confirm: false,
    matter_id: 'MTR_API_1_61355827191366',
    all: true,
  });
  assert.ok('isError' in result && result.isError === true);
  const body = JSON.parse(result.content[0]?.text ?? '{}') as { error: string };
  assert.match(body.error, /confirm: true/);
});

test('lpza_send_invoice maps to salesinvoice.send with null fixture response', async () => {
  const uid = 'SI__API_1_5797205714080';
  const url = `${base}/salesinvoice/send/${uid}`;
  const { client } = createTestClient({
    [url]: () => new Response('null', { status: 200 }),
  });

  const result = await sendInvoice(client, { salesinvoice_uid: uid });
  assert.equal(result, sendInvoiceResponse);
});

test('lpza_send_invoice refuses without confirm: true', async () => {
  const { client } = createTestClient({});
  const result = await handleSendInvoice(client, {
    confirm: false,
    salesinvoice_uid: 'SI__API_1_5797205714080',
  });
  assert.ok('isError' in result && result.isError === true);
  const body = JSON.parse(result.content[0]?.text ?? '{}') as { error: string };
  assert.match(body.error, /confirm: true/);
});
