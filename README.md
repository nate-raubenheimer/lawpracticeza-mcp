# LawPracticeZA MCP

[![CI](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml)

MCP (Model Context Protocol) server for [LawPracticeZA](https://lawpracticeza.com), South African legal practice software. It exposes curated tools for clients, matters, WIP fees, billing, and accounting — not a 1:1 dump of every undocumented `object`/`method`.

The stdio server registers curated **read** tools (APP-132) plus a bootstrap `lpza_ping` helper. Live LawPracticeZA calls require `LPZA_DATABASE`, `LPZA_LOGIN_CODE`, and `LPZA_PASSWORD`; without them, read tools return `credentials_missing`. CI uses fixture-backed mock HTTP only.

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
| `LPZA_DATABASE` | yes (for read tools) | LawPracticeZA firm database name |
| `LPZA_LOGIN_CODE` | yes (for read tools) | API login code |
| `LPZA_PASSWORD` | yes (for read tools) | API password |
| `LPZA_BASE_URL` | no | Defaults to `https://lawpracticeza.com/api` |

Copy `.env.example` to `.env` for local values. Never commit credentials.

## MCP tools

### Bootstrap

| Tool | Description |
| --- | --- |
| `lpza_ping` | Confirms the stdio process is alive; does not call LawPracticeZA |

### Session / lookups

| Tool | LawPracticeZA API | Notes |
| --- | --- | --- |
| `lpza_status` | `access.status` | Session logged-in state and login identity |
| `lpza_firm_details` | `company.detail/only` | Firm name, VAT flag, contact details |
| `lpza_list_departments` | `department/list` or `listforselection` | Optional `for_selection: true` |
| `lpza_list_fee_earners` | `salesagent/list` | Fee earners |
| `lpza_list_posting_codes` | `product/list` | Posting codes (products) |

### Clients / matters

| Tool | LawPracticeZA API | Notes |
| --- | --- | --- |
| `lpza_list_clients` | `customer/list` | |
| `lpza_get_client` | `customer/detail/{customer_id}` | Requires `customer_id` |
| `lpza_list_matters` | `matter/list` | |
| `lpza_get_matter` | `matter/detail/{matter_id}` | Optional `lookup: ""` for raw FK IDs |

### Accounting reads

| Tool | LawPracticeZA API | Notes |
| --- | --- | --- |
| `lpza_matter_balances` | `matter.balances/{matter_id}` | Business, trust, investment balances |
| `lpza_matter_statement` | `matter.statement2/{matter_id}` | Optional `customer_id`, `startdate`, `stopdate` |
| `lpza_matter_business_entries` | `matter.statement3/{matter_id}` | Business ledger entries (invoice level) |

### Errors

Read tools return JSON with `isError: true` when:

- Credentials are missing (`credentials_missing`)
- LawPracticeZA returns HTTP 403 (`LpzaAuthError`), 406 (`LpzaValidationError`), or 500 (`LpzaServerError`)

Planned later: WIP/billing with confirm gates, `lpza_api_call` escape hatch.

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
| `types.ts` | Schema types: `customer`, `matter`, `matterdraftlineitem`, `product`, `productcategory`, `bankaccount` |

Fixture tests in `tests/lpza-client.test.ts` and `tests/read-tools.test.ts` mock HTTP — no live credentials required.

## Limits

- Write tools (create/update/bill/send) are not implemented yet.
- Trust/investment **write** operations are out of scope unless the official guide documents them. Do not invent them.
- Do not hardcode VAT at 14% (2017 examples) or 15%. Callers supply amounts.
- Remote / HTTP MCP hosting is out of scope for v1 (stdio only: Cursor, Claude Desktop).

## License

[GNU General Public License v3.0](./LICENSE) only.
