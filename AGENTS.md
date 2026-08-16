# Agent notes — LawPracticeZA MCP

Public MCP server (`nate-raubenheimer/lawpracticeza-mcp`) that will talk to [LawPracticeZA](https://lawpracticeza.com/docs/api_guide.html) over stdio. This repo is GPL-3.0.

Planning map: [APP-129](https://linear.app/marulamedia/issue/APP-129/wayfinder-map-lawpracticeza-mcp). Project: [LawPracticeZA MCP](https://linear.app/marulamedia/project/lawpracticeza-mcp-2237f3e693de).

## Commands

```sh
npm start          # MCP over stdio (npx tsx src/index.ts)
npm test
npm run typecheck
```

Package manager is **npm**. Node 20+. Official MCP SDK v2 (`@modelcontextprotocol/server`). Log to **stderr** only — stdout is the JSON-RPC channel.

## Layout

| Path | Role |
| --- | --- |
| `src/index.ts` | stdio entry (`serveStdio`) |
| `src/server.ts` | `createServer()` factory |
| `src/lpza/` | HTTP client (`LpzaClient`, auth, errors, schema types) |
| `src/tools/` | MCP tools (ping, client/matter/transfer/WIP writes) |
| `tests/fixtures/` | API-guide JSON (later tickets) |

## Rules (also in `.cursor/rules/`)

1. **Docs** — keep README, AGENTS.md, and tool lists consistent with the code.
2. **Secrets** — never commit or log `LPZA_DATABASE`, `LPZA_LOGIN_CODE`, `LPZA_PASSWORD`, or session tokens.
3. **Trust writes** — do not invent undocumented trust/investment write APIs. Reads via `statement2` / `balances` are fine. Escape hatch is `lpza_api_call` (APP-134).
4. **Linear** — when an issue’s acceptance criteria are met, set status to **In Review**, not Done.

## Env (live access later)

| Variable | Required later | Notes |
| --- | --- | --- |
| `LPZA_DATABASE` | yes | Firm database name |
| `LPZA_LOGIN_CODE` | yes | API login |
| `LPZA_PASSWORD` | yes | API password |
| `LPZA_BASE_URL` | no | Default `https://lawpracticeza.com/api` |

There is **no live LawPracticeZA access** until credentials are configured (`LPZA_DATABASE`, `LPZA_LOGIN_CODE`, `LPZA_PASSWORD`). Write tools (APP-137) call the API when credentials exist; fixture tests mock HTTP without live access.

## VAT and writes

Do not hardcode 14% or 15% VAT. Confirm gates (`confirm: true`) are required for bill, send, and quickdelete.
