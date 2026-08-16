# Fixtures

Contract JSON copied from the [LawPracticeZA API guide](https://lawpracticeza.com/docs/api_guide.html) lives here.

| File | Source |
| --- | --- |
| `access-login-response.json` | `access.login` response from the API guide |
| `access-status-logged-in.json` | `access.status` when logged in |
| `access-status-logged-out.json` | `access.status` when logged out |
| `customer-insert-response.json` | `customer.insert` response |
| `matter-insert-response.json` | `matter.insert` response |
| `matter-detail-response.json` | `matter.detail` with `lookup=""` |
| `matter-update-response.json` | `matter.update` response |
| `matterset-createtransfer-response.json` | `matterset.createtransfer` response |
| `matterdraftlineitem-childlist-response.json` | `matterdraftlineitem.childlist` response |
| `matterdraftlineitem-upsert-response.json` | `matterdraftlineitem.upsert` response |
| `matterdraftlineitem-quickdelete-response.json` | `matterdraftlineitem.quickdelete` response |
| `matter-bill-items-response.json` | `matter.bill` with specific `matterdraftlineitems` |
| `matter-bill-all-response.json` | `matter.bill` with `all=1` |
| `salesinvoice-send-response.json` | `salesinvoice.send` response (`null`) |

Tests mock HTTP and load these fixtures — no live credentials required.
