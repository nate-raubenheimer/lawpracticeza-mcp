# LawPracticeZA MCP

[![CI](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml)

MCP (Model Context Protocol) server for [LawPracticeZA](https://lawpracticeza.com), South African legal practice software. It exposes curated tools for clients, matters, WIP fees, billing, and accounting — not a 1:1 dump of every undocumented `object`/`method`.

The stdio server registers curated **read** tools (APP-132), **write** tools for clients/matters/transfers/WIP (APP-137), and a bootstrap `lpza_ping` helper. Live LawPracticeZA calls require `LPZA_DATABASE`, `LPZA_LOGIN_CODE`, and `LPZA_PASSWORD`; without them, tools return a configuration error. CI uses fixture-backed mock HTTP only.

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

### Cloud Agent / CI secrets

For live verification in Cursor Cloud Agents, add these as **environment secrets** (not committed files):

| Secret name | Value |
| --- | --- |
| `LPZA_DATABASE` | MS&B Inc firm code / database name |
| `LPZA_LOGIN_CODE` | Bookkeeper API user login code |
| `LPZA_PASSWORD` | API password |

Once secrets are configured, run:

```sh
npm run verify:login
```

The script calls `access.login` and `access.status` and prints only non-sensitive fields (database name, login name). It exits non-zero when credentials are missing or login fails.

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

### Clients / matters (read)

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

### Clients / matters / WIP (write)

| Tool | API | Notes |
| --- | --- | --- |
| `lpza_create_client` | `customer.insert` | Requires `customer_name`, `customer_code`, `department_id` |
| `lpza_create_matter` | `matter.insert` | Creates a matter under a client |
| `lpza_update_matter` | `matter.detail` + `matter.update` | Fetch-merge-full-update (not partial) |
| `lpza_create_transfer` | `matterset.createtransfer` | Buyer/seller matters for conveyancing |
| `lpza_list_unbilled` | `matterdraftlineitem.childlist` | WIP draft fees for a matter |
| `lpza_upsert_draft_fee` | `matterdraftlineitem.upsert` | Caller supplies `unitprice` / `tax` / `trantotal` |
| `lpza_delete_draft_fee` | `matterdraftlineitem.quickdelete` | Requires `confirm: true` |

### Errors

Read tools return JSON with `isError: true` when credentials are missing (`credentials_missing`) or LawPracticeZA returns HTTP 403 (`LpzaAuthError`), 406 (`LpzaValidationError`), or 500 (`LpzaServerError`). Write tools refuse without credentials or when `confirm: true` is missing on destructive actions.

Planned later: billing with confirm gates and `lpza_api_call` escape hatch.

## Development

```sh
npm run typecheck
npm test
npm run verify:login   # requires LPZA_* env; see README
```

CI runs typecheck and tests on push and pull request to `main`.

## HTTP client (`src/lpza/`)

| Module | Role |
| --- | --- |
| `client.ts` | `LpzaClient.call()` — form-urlencoded POST to `{base}/{object}/{method}/{positional…}` |
| `auth.ts` | `access.login`, in-memory token, `X-token` header, `access.status()` |
| `errors.ts` | Typed errors for HTTP 200 / 403 / 406 / 500 |
| `types.ts` | Schema types: `customer`, `matter`, `matterdraftlineitem`, `product`, etc. |

Fixture tests in `tests/lpza-client.test.ts`, `tests/read-tools.test.ts`, and `tests/write-tools.test.ts` mock HTTP — no live credentials required.

## Limits

- Without env credentials, read and write tools refuse with a configuration error (no live session).
- Trust/investment **write** operations are out of scope unless the official guide documents them. Do not invent them.
- Do not hardcode VAT at 14% (2017 examples) or 15%. Callers supply amounts.
- Remote / HTTP MCP hosting is out of scope for v1 (stdio only: Cursor, Claude Desktop).

## License

[GNU General Public License v3.0](./LICENSE) only.
