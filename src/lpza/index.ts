/**
 * LawPracticeZA HTTP client — form-urlencoded POST to
 * `{base}/api/{object}/{method}/{positional…}`, `access.login`, `X-token`,
 * and a single re-login on HTTP 403.
 *
 * Required env for live calls (do not log or commit values):
 * - `LPZA_DATABASE`
 * - `LPZA_LOGIN_CODE`
 * - `LPZA_PASSWORD`
 * - `LPZA_BASE_URL` (optional, default `https://lawpracticeza.com/api`)
 *
 * MCP tools do not call LawPracticeZA yet. Use fixture-backed tests without
 * live credentials.
 */

export {
  LpzaAuth,
  LPZA_ENV,
  credentialsFromEnv,
  type LpzaAuthRequest,
  type LpzaCredentials,
} from './auth.js';
export {
  LpzaClient,
  DEFAULT_LPZA_BASE_URL,
  type FetchFn,
  type LpzaClientOptions,
  type LpzaCallOptions,
} from './client.js';
export {
  LpzaError,
  LpzaValidationError,
  LpzaServerError,
  LpzaAuthError,
  mapLpzaResponse,
} from './errors.js';
export type {
  AccessStatus,
  AccessStatusLoggedIn,
  AccessStatusLoggedOut,
  BankAccount,
  BankAccountBticode,
  Customer,
  LoginResponse,
  Matter,
  MatterDraftLineItem,
  MatterDraftLineItemStatus,
  Product,
  ProductCategory,
} from './types.js';
