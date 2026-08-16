#!/usr/bin/env npx tsx
/**
 * Smoke-check LawPracticeZA credentials via access.login and access.status.
 * Reads LPZA_DATABASE, LPZA_LOGIN_CODE, and LPZA_PASSWORD from the environment.
 * Never prints credentials or session tokens.
 */
import {
  credentialsFromEnv,
  LpzaClient,
  LPZA_ENV,
} from '../src/lpza/index.js';

function missingVars(): string[] {
  return Object.values(LPZA_ENV)
    .filter((name) => name !== LPZA_ENV.baseUrl)
    .filter((name) => !process.env[name]);
}

async function main(): Promise<void> {
  const missing = missingVars();
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
    console.error(
      'Set them in .env locally or in your Cloud Agent environment secrets.',
    );
    process.exit(1);
  }

  const credentials = credentialsFromEnv();
  if (!credentials) {
    console.error('Could not read LawPracticeZA credentials from the environment.');
    process.exit(1);
  }

  const client = new LpzaClient({
    credentials,
    baseUrl: process.env[LPZA_ENV.baseUrl],
  });

  await client.login();
  const status = await client.status();

  if (!status.loggedin) {
    console.error('access.login succeeded but access.status reports loggedin=false.');
    process.exit(1);
  }

  console.log('LawPracticeZA login OK');
  console.log(`database: ${status.database}`);
  console.log(`login_name: ${status.login_name}`);
  console.log(`login_code: ${status.login_code}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Login verification failed: ${message}`);
  process.exit(1);
});
