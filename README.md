# LawPracticeZA MCP

[![CI](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml)

MCP (Model Context Protocol) server for [LawPracticeZA](https://lawpracticeza.com), South African legal practice software. It exposes curated tools for clients, matters, WIP fees, billing, and accounting — not a 1:1 dump of every undocumented `object`/`method`.

The typed HTTP client (`src/lpza/`) and write tools for clients, matters, transfers, and WIP are implemented with fixture-backed tests. **Live LawPracticeZA calls require credentials** (`LPZA_DATABASE`, `LPZA_LOGIN_CODE`, `LPZA_PASSWORD`); without them, write tools return a configuration error.

- API guide: <https://lawpracticeza.com/docs/api_guide.html>
- Schema: <https://lawpracticeza.com/docs/schema.html>
- License: [GPL-3.0-only](./LICENSE)

## Requirements

- Node.js 20 or later
- npm

## Run

```sh
npm install
npx tsx src/index.ts
```

Or `npm start`. The server waits on stdin. Logs go to stderr; stdout is the MCP JSON-RPC channel.

Exercise it without a host:

```sh
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `LPZA_DATABASE` | yes (for live tools) | LawPracticeZA firm database name |
| `LPZA_LOGIN_CODE` | yes (for live tools) | API login code |
| `LPZA_PASSWORD` | yes (for live tools) | API password |
| `LPZA_BASE_URL` | no | Defaults to `https://lawpracticeza.com/api` |

Copy `.env.example` to `.env` for local values. Never commit credentials.

## MCP tools

| Tool | API | Notes |
| --- | --- | --- |
| `lpza_ping` | — | Confirms stdio process is alive; does not call LawPracticeZA |
| `lpza_create_client` | `customer.insert` | Requires `customer_name`, `customer_code`, `department_id` |
| `lpza_create_matter` | `matter.insert` | Creates a matter under a client |
| `lpza_update_matter` | `matter.detail` + `matter.update` | Fetch-merge-full-update (not partial) |
| `lpza_create_transfer` | `matterset.createtransfer` | Buyer/seller matters for conveyancing |
| `lpza_list_unbilled` | `matterdraftlineitem.childlist` | WIP draft fees for a matter |
| `lpza_upsert_draft_fee` | `matterdraftlineitem.upsert` | Caller supplies `unitprice` / `tax` / `trantotal` |
| `lpza_delete_draft_fee` | `matterdraftlineitem.quickdelete` | Requires `confirm: true` |

Planned (not in this release): session/lookup reads, billing with confirm gates, accounting reads, and `lpza_api_call`.

## Development

```sh
npm run typecheck
npm test
```

CI runs typecheck and tests on push and pull request to `main`.

## HTTP client (`src/lpza/`)

| Module | Role |
| --- | --- |
| `client.ts` | `LpzaClient.call()` — form-urlencoded POST to `{base}/{object}/{method}/{positional…}` |
| `auth.ts` | `access.login`, in-memory token, `X-token` header, `access.status()` |
| `errors.ts` | Typed errors for HTTP 200 / 403 / 406 / 500 |
| `types.ts` | Schema types: `customer`, `matter`, `matterdraftlineitem`, `product`, etc. |

Fixture tests in `tests/lpza-client.test.ts` and `tests/write-tools.test.ts` mock HTTP — no live credentials required.

## Limits

- Without env credentials, write tools refuse with a configuration error (no live session).
- Trust/investment **write** operations are out of scope unless the official guide documents them. Do not invent them.
- Do not hardcode VAT at 14% (2017 examples) or 15%. Callers supply amounts.
- Remote / HTTP MCP hosting is out of scope for v1 (stdio only: Cursor, Claude Desktop).

## License

[GNU General Public License v3.0](./LICENSE) only.
