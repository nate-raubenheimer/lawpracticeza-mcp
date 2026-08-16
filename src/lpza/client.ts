import { LpzaAuth, type LpzaAuthRequest, type LpzaCredentials } from './auth.js';
import { LpzaAuthError, mapLpzaResponse } from './errors.js';
import type { AccessStatus } from './types.js';

export const DEFAULT_LPZA_BASE_URL = 'https://lawpracticeza.com/api';

export type FetchFn = typeof fetch;

export interface LpzaClientOptions {
  baseUrl?: string;
  credentials: LpzaCredentials;
  fetch?: FetchFn;
  auth?: LpzaAuth;
}

export interface LpzaCallOptions {
  skipAuth?: boolean;
}

/**
 * Typed HTTP client for LawPracticeZA REST API.
 * POSTs `application/x-www-form-urlencoded` bodies to
 * `{baseUrl}/{object}/{method}/{positional…}`.
 */
export class LpzaClient {
  readonly baseUrl: string;
  readonly auth: LpzaAuth;
  private readonly fetchFn: FetchFn;

  constructor(options: LpzaClientOptions) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_LPZA_BASE_URL).replace(/\/$/, '');
    this.fetchFn = options.fetch ?? fetch;
    this.auth = options.auth ?? new LpzaAuth(options.credentials);
  }

  buildUrl(object: string, method: string, positional?: string[]): string {
    const segments = [object, method, ...(positional ?? [])];
    return `${this.baseUrl}/${segments.join('/')}`;
  }

  async login(): Promise<string> {
    return this.auth.login(this.createAuthRequest());
  }

  async status(): Promise<AccessStatus> {
    return this.auth.status(this.createAuthRequest());
  }

  async call<T = unknown>(
    object: string,
    method: string,
    positional?: string[],
    params?: Record<string, string>,
    options?: LpzaCallOptions,
  ): Promise<T> {
    return this.executeCall<T>(object, method, positional, params, options, true);
  }

  private createAuthRequest(): LpzaAuthRequest {
    return (object, method, positional, params, options) =>
      this.call(object, method, positional, params, options);
  }

  private async executeCall<T>(
    object: string,
    method: string,
    positional: string[] | undefined,
    params: Record<string, string> | undefined,
    options: LpzaCallOptions | undefined,
    allowRelogin: boolean,
  ): Promise<T> {
    const url = this.buildUrl(object, method, positional);
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (!options?.skipAuth) {
      const token = this.auth.getToken();
      if (token) {
        headers['X-token'] = token;
      }
    }

    const body =
      params && Object.keys(params).length > 0
        ? new URLSearchParams(params).toString()
        : '';

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers,
      body,
    });

    const responseBody = await response.text();

    if (response.status === 403 && allowRelogin && !options?.skipAuth) {
      await this.auth.login(this.createAuthRequest());
      return this.executeCall<T>(
        object,
        method,
        positional,
        params,
        options,
        false,
      );
    }

    if (response.status === 403) {
      throw new LpzaAuthError(responseBody);
    }

    mapLpzaResponse(response.status, responseBody);

    if (!responseBody) {
      return undefined as T;
    }

    return JSON.parse(responseBody) as T;
  }
}
