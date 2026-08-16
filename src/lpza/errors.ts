/**
 * Typed errors for LawPracticeZA HTTP responses.
 * Never include credentials or session tokens in messages or logged fields.
 */

export class LpzaError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = 'LpzaError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/** HTTP 406 — validation or other caller error with response body text. */
export class LpzaValidationError extends LpzaError {
  constructor(responseBody: string) {
    super('LawPracticeZA validation error', 406, responseBody);
    this.name = 'LpzaValidationError';
  }
}

/** HTTP 500 — application / unhandled error with response body text. */
export class LpzaServerError extends LpzaError {
  constructor(responseBody: string) {
    super('LawPracticeZA server error', 500, responseBody);
    this.name = 'LpzaServerError';
  }
}

/** HTTP 403 — authentication failed (including after a single re-login retry). */
export class LpzaAuthError extends LpzaError {
  constructor(responseBody: string) {
    super('LawPracticeZA authentication error', 403, responseBody);
    this.name = 'LpzaAuthError';
  }
}

export function mapLpzaResponse(status: number, responseBody: string): void {
  if (status === 406) {
    throw new LpzaValidationError(responseBody);
  }
  if (status === 500) {
    throw new LpzaServerError(responseBody);
  }
  if (status === 403) {
    throw new LpzaAuthError(responseBody);
  }
  if (status !== 200) {
    throw new LpzaError(
      `LawPracticeZA request failed with status ${status}`,
      status,
      responseBody,
    );
  }
}
