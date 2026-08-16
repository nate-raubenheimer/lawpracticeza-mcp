# LawPracticeZA MCP

[![CI](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml)

MCP (Model Context Protocol) server for [LawPracticeZA](https://lawpracticeza.com), South African legal practice software. It will expose curated tools for clients, matters, WIP fees, billing, and accounting — not a 1:1 dump of every undocumented `object`/`method`.

**This repository is a bootstrap.** There is **no live LawPracticeZA access** in MCP tools yet. The process speaks MCP over stdio with a placeholder `lpza_ping` tool. The typed HTTP client (`src/lpza/`) is implemented for fixture-backed tests; curated MCP tools and live tests land in later issues.

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

Live API calls from **MCP tools** are **not implemented** in this version. The HTTP client in `src/lpza/` reads credentials when callers construct `LpzaClient`; the stdio server does not call LawPracticeZA yet.

| Variable | Required | Description |
| --- | --- | --- |
| `LPZA_DATABASE` | yes (for live client) | LawPracticeZA firm database name |
| `LPZA_LOGIN_CODE` | yes (for live client) | API login code |
| `LPZA_PASSWORD` | yes (for live client) | API password |
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

## Current MCP tools

| Tool | Status |
| --- | --- |
| `lpza_ping` | Placeholder — confirms the stdio process is alive; does not call LawPracticeZA |

Planned tools (not in this release): session/lookups, clients/matters, WIP/billing with confirm gates, accounting reads, and `lpza_api_call`.

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
| `types.ts` | Schema types: `customer`, `matter`, `matterdraftlineitem`, `product`, `productcategory`, `bankaccount` |

Fixture tests in `tests/lpza-client.test.ts` mock HTTP — no live credentials required.

## Limits

- MCP tools do not call LawPracticeZA yet (`lpza_ping` only checks the stdio process).
- Trust/investment **write** operations are out of scope unless the official guide documents them. Do not invent them.
- Do not hardcode VAT at 14% (2017 examples) or 15%. Callers supply amounts.
- Remote / HTTP MCP hosting is out of scope for v1 (stdio only: Cursor, Claude Desktop).

## License

[GNU General Public License v3.0](./LICENSE) only.
