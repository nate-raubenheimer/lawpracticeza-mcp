import { serveStdio } from '@modelcontextprotocol/server/stdio';

import { SERVER_NAME } from './meta';
import { createServer } from './server';

void serveStdio(createServer);
console.error(`${SERVER_NAME} running on stdio`);
