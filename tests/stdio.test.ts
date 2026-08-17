import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const root = fileURLToPath(new URL('..', import.meta.url));
const tsxCli = fileURLToPath(import.meta.resolve('tsx/cli'));

let client: Client;

before(async () => {
  client = new Client({ name: 'lawpracticeza-mcp-test', version: '0.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [tsxCli, 'src/index.ts'],
    cwd: root,
  });
  await client.connect(transport);
});

after(async () => {
  await client.close();
});

test('stdio server advertises lpza_ping, read tools, and write tools', async () => {
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);

  const ping = tools.find((tool) => tool.name === 'lpza_ping');
  assert.ok(ping, 'expected lpza_ping to be registered');
  assert.match(ping.description ?? '', /does not call/i);

  const readToolNames = [
    'lpza_status',
    'lpza_firm_details',
    'lpza_list_departments',
    'lpza_list_fee_earners',
    'lpza_list_posting_codes',
    'lpza_list_clients',
    'lpza_get_client',
    'lpza_list_matters',
    'lpza_get_matter',
    'lpza_matter_balances',
    'lpza_matter_statement',
    'lpza_matter_business_entries',
  ];
  for (const name of readToolNames) {
    assert.ok(names.includes(name), `expected ${name} to be registered`);
  }

  assert.ok(names.includes('lpza_create_client'), 'expected lpza_create_client');
  assert.ok(names.includes('lpza_delete_draft_fee'), 'expected lpza_delete_draft_fee');
});

test('lpza_status without credentials reports credentials_missing', async () => {
  const result = await client.callTool({ name: 'lpza_status', arguments: {} });
  assert.equal(result.isError, true);
  const text = result.content
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('');
  const body = JSON.parse(text) as { error: string };
  assert.equal(body.error, 'credentials_missing');
});

test('lpza_ping reports no live API', async () => {
  const result = await client.callTool({ name: 'lpza_ping', arguments: {} });
  assert.equal(result.isError, undefined);
  const text = result.content
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('');
  const body = JSON.parse(text) as { ok: boolean; liveApi: boolean };
  assert.equal(body.ok, true);
  assert.equal(body.liveApi, false);
});
