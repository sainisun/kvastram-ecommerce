import { createServer } from 'node:http';

const port = Number.parseInt(process.env.MOCK_API_PORT || '4000', 10);

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.url === '/health') {
    response.end(JSON.stringify({ status: 'healthy', service: 'e2e-mock-api' }));
    return;
  }

  if (request.url === '/auth/csrf') {
    response.end(JSON.stringify({ csrf_token: 'e2e-csrf-token' }));
    return;
  }

  response.end(JSON.stringify({}));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`E2E mock API listening on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
