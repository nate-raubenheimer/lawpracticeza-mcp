# LawPracticeZA MCP

[![CI](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/nate-raubenheimer/lawpracticeza-mcp/actions/workflows/ci.yml)

MCP (Model Context Protocol) server for [LawPracticeZA](https://lawpracticeza.com), South African legal practice software. It will expose curated tools for clients, matters, WIP fees, billing, and accounting — not a 1:1 dump of every undocumented `object`/`method`.

**This repository is a bootstrap.** There is **no live LawPracticeZA access** yet. The process speaks MCP over stdio with a placeholder `lpza_ping` tool. The HTTP client, curated tools, and live tests land in later issues.

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

Live API calls are **not implemented** in this version. When they are, the server will read:

| Variable | Required | Description |
| --- | --- | --- |
| `LPZA_DATABASE` | yes (later) | LawPracticeZA firm database name |
| `LPZA_LOGIN_CODE` | yes (later) | API login code |
| `LPZA_PASSWORD` | yes (later) | API password |
| `LPZA_BASE_URL` | no | Defaults to `https://lawpracticeza.com/api` |

Copy `.env.example` to `.env` for local values. Never commit credentials.

## Current MCP tools

| Tool | Status |
| --- | --- |
| `lpza_ping` | Placeholder — confirms the stdio process is alive; does not call LawPracticeZA |

Planned tools (not in this release): session/lookups, clients/matters, WIP/billing with confirm gates, accounting reads, and `lpza_api_call`.

## Development

```sh
npm run typecheck
npm test
```

CI runs typecheck and tests on push and pull request to `main`.

## Limits

- No live LawPracticeZA session until credentials and the HTTP client exist.
- Trust/investment **write** operations are out of scope unless the official guide documents them. Do not invent them.
- Do not hardcode VAT at 14% (2017 examples) or 15%. Callers supply amounts.
- Remote / HTTP MCP hosting is out of scope for v1 (stdio only: Cursor, Claude Desktop).

## License

[GNU General Public License v3.0](./LICENSE) only.
