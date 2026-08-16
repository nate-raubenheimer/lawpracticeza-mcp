import type { AccessStatus, LoginResponse } from './types.js';

export interface LpzaCredentials {
  database: string;
  loginCode: string;
  password: string;
}

export const LPZA_ENV = {
  database: 'LPZA_DATABASE',
  loginCode: 'LPZA_LOGIN_CODE',
  password: 'LPZA_PASSWORD',
  baseUrl: 'LPZA_BASE_URL',
} as const;

/** Read credentials from environment. Returns undefined if any required var is missing. */
export function credentialsFromEnv(): LpzaCredentials | undefined {
  const database = process.env[LPZA_ENV.database];
  const loginCode = process.env[LPZA_ENV.loginCode];
  const password = process.env[LPZA_ENV.password];
  if (!database || !loginCode || !password) {
    return undefined;
  }
  return { database, loginCode, password };
}

export type LpzaAuthRequest = (
  object: string,
  method: string,
  positional?: string[],
  params?: Record<string, string>,
  options?: { skipAuth?: boolean },
) => Promise<unknown>;

/**
 * In-memory session token and `access.login` / `access.status` helpers.
 * Does not log credentials or tokens.
 */
export class LpzaAuth {
  private token: string | null = null;

  constructor(private readonly credentials: LpzaCredentials) {}

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  /** POST `access.login` and store the returned token. */
  async login(request: LpzaAuthRequest): Promise<string> {
    const response = (await request(
      'access',
      'login',
      undefined,
      {
        database: this.credentials.database,
        login_code: this.credentials.loginCode,
        password: this.credentials.password,
      },
      { skipAuth: true },
    )) as LoginResponse;

    this.token = response.token;
    return response.token;
  }

  /** POST `access.status` using the current token (via `X-token`). */
  async status(request: LpzaAuthRequest): Promise<AccessStatus> {
    return request('access', 'status') as Promise<AccessStatus>;
  }
}
