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

test('stdio server advertises lpza_ping and write tools', async () => {
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);
  assert.ok(names.includes('lpza_ping'), 'expected lpza_ping');
  assert.ok(names.includes('lpza_create_client'), 'expected lpza_create_client');
  assert.ok(names.includes('lpza_delete_draft_fee'), 'expected lpza_delete_draft_fee');
  assert.ok(names.includes('lpza_bill_matter'), 'expected lpza_bill_matter');
  assert.ok(names.includes('lpza_send_invoice'), 'expected lpza_send_invoice');
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
