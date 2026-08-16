/**
 * LawPracticeZA HTTP client — stub.
 *
 * APP-131 implements `LpzaClient`: form-urlencoded POST to
 * `{base}/api/{object}/{method}/{positional…}`, `access.login`, `X-token`,
 * and a single re-login on HTTP 403.
 *
 * Required env (later; do not log or commit values):
 * - `LPZA_DATABASE`
 * - `LPZA_LOGIN_CODE`
 * - `LPZA_PASSWORD`
 * - `LPZA_BASE_URL` (optional, default `https://lawpracticeza.com/api`)
 *
 * There is no live LawPracticeZA access in this bootstrap. Do not invent
 * trust/investment write helpers; those are undocumented.
 */

export const DEFAULT_LPZA_BASE_URL = 'https://lawpracticeza.com/api';

export const LPZA_ENV = {
  database: 'LPZA_DATABASE',
  loginCode: 'LPZA_LOGIN_CODE',
  password: 'LPZA_PASSWORD',
  baseUrl: 'LPZA_BASE_URL',
} as const;
