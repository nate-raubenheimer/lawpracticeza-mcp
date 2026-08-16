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
  assert.ok(names.includes('lpza_api_call'), 'expected lpza_api_call');
});

test('stdio server advertises resources and schema notes read without credentials', async () => {
  const { resources } = await client.listResources();
  const uris = resources.map((resource) => resource.uri);
  assert.ok(uris.includes('lpza://firm'), 'expected lpza://firm');
  assert.ok(uris.includes('lpza://schema-notes'), 'expected lpza://schema-notes');

  const notes = await client.readResource({ uri: 'lpza://schema-notes' });
  const text = notes.contents
    .filter((block) => 'text' in block)
    .map((block) => ('text' in block ? block.text : ''))
    .join('');
  assert.match(text, /lawpracticeza\.com\/docs\/api_guide\.html/);
});

test('stdio server advertises workflow prompts', async () => {
  const { prompts } = await client.listPrompts();
  const names = prompts.map((prompt) => prompt.name);
  assert.ok(names.includes('lpza_fee_posting'), 'expected lpza_fee_posting');
  assert.ok(names.includes('lpza_invoice_matter'), 'expected lpza_invoice_matter');

  const prompt = await client.getPrompt({
    name: 'lpza_fee_posting',
    arguments: { matter_id: 'MTR_TEST_1' },
  });
  const text = prompt.messages
    .map((message) =>
      message.content.type === 'text' ? message.content.text : '',
    )
    .join('');
  assert.match(text, /lpza_list_unbilled/);
  assert.match(text, /MTR_TEST_1/);
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
