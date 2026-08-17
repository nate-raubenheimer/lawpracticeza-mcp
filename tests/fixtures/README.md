# Fixtures

Contract JSON copied from the [LawPracticeZA API guide](https://lawpracticeza.com/docs/api_guide.html) lives here.

| File | Source |
| --- | --- |
| `access-login-response.json` | `access.login` response from the API guide |
| `access-status-logged-in.json` | `access.status` when logged in |
| `access-status-logged-out.json` | `access.status` when logged out |
| `company-detail-only.json` | `company.detail/only` firm details response |
| `matter-statement2.json` | Representative `matter.statement2` response (subset of guide example) |
| `matter-statement3.json` | `matter.statement3` business entries response |
| `customer-insert-response.json` | `customer.insert` response |
| `matter-insert-response.json` | `matter.insert` response |
| `matter-detail-response.json` | `matter.detail` with `lookup=""` |
| `matter-update-response.json` | `matter.update` response |
| `matterset-createtransfer-response.json` | `matterset.createtransfer` response |
| `matterdraftlineitem-childlist-response.json` | `matterdraftlineitem.childlist` response |
| `matterdraftlineitem-upsert-response.json` | `matterdraftlineitem.upsert` response |
| `matterdraftlineitem-quickdelete-response.json` | `matterdraftlineitem.quickdelete` response |

Tests mock HTTP and load these fixtures — no live credentials required.

`matter.balances` is documented in the guide but has no published response JSON; tests verify the request URL only.

List endpoints (`department/list`, `salesagent/list`, `product/list`, `customer/list`, `matter/list`) follow the documented `/api/{object}/list` pattern; the guide does not publish full list response schemas, so list tool tests use minimal `{ data: [] }` mocks.
