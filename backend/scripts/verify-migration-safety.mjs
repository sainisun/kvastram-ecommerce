import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import postgres from 'postgres';

const baseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!baseUrl) {
  throw new Error(
    'MIGRATION_TEST_DATABASE_URL or DATABASE_URL is required for migration safety tests.'
  );
}

const requestedDatabase =
  process.env.MIGRATION_TEST_DATABASE ||
  `kvastram_migration_safety_${randomUUID().replaceAll('-', '').slice(0, 12)}`;

if (!/^[a-z][a-z0-9_]{0,62}$/.test(requestedDatabase)) {
  throw new Error('MIGRATION_TEST_DATABASE must be a valid lowercase PostgreSQL identifier.');
}

const targetUrl = new URL(baseUrl);
targetUrl.pathname = `/${requestedDatabase}`;

const adminBaseUrl = process.env.MIGRATION_TEST_ADMIN_DATABASE_URL || baseUrl;
const adminUrl = new URL(adminBaseUrl);
adminUrl.pathname = '/postgres';

const applicationRole = decodeURIComponent(targetUrl.username);
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(applicationRole)) {
  throw new Error('Migration test database URL must use a valid PostgreSQL role name.');
}

function run(command, args, environment) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit ${result.status}\n${result.stdout}\n${result.stderr}`
    );
  }

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

async function assertSchema(connectionString) {
  const client = postgres(connectionString, { max: 1 });
  try {
    const tableResult = await client`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('customers', 'products', 'orders', 'line_items', 'returns', 'security_events')
      order by table_name
    `;
    const actualTables = new Set(tableResult.map((row) => row.table_name));
    const expectedTables = [
      'customers',
      'products',
      'orders',
      'line_items',
      'returns',
      'security_events',
    ];

    const missingTables = expectedTables.filter((name) => !actualTables.has(name));
    if (missingTables.length) {
      throw new Error(`Migration safety assertion failed; missing tables: ${missingTables.join(', ')}`);
    }

    const columnResult = await client`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name = 'idempotency_key'
    `;
    if (columnResult.length !== 1) {
      throw new Error('Migration safety assertion failed; orders.idempotency_key is missing.');
    }

    const journalResult = await client`
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'drizzle'
          and table_name = '__drizzle_migrations'
      ) as exists
    `;
    if (!journalResult[0]?.exists) {
      throw new Error('Migration safety assertion failed; Drizzle migration journal is missing.');
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const admin = postgres(adminUrl.toString(), { max: 1 });

  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${requestedDatabase}" WITH (FORCE)`);
    await admin.unsafe(`CREATE DATABASE "${requestedDatabase}" OWNER "${applicationRole}"`);
    await admin.end();

    const provisioningUrl = new URL(adminBaseUrl);
    provisioningUrl.pathname = `/${requestedDatabase}`;
    const provisioningClient = postgres(provisioningUrl.toString(), { max: 1 });
    try {
      await provisioningClient`create extension if not exists vector`;
    } finally {
      await provisioningClient.end();
    }

    const migrationEnvironment = {
      ...process.env,
      DATABASE_URL: targetUrl.toString(),
      NODE_ENV: 'test',
    };

    console.log(`\n▶ Applying Drizzle migrations to ${requestedDatabase}`);
    run('npx', ['tsx', 'src/db/migrate.ts'], migrationEnvironment);

    console.log('\n▶ Re-running Drizzle migrations to prove idempotency');
    run('npx', ['tsx', 'src/db/migrate.ts'], migrationEnvironment);

    console.log('\n▶ Applying manual SQL migrations');
    run('npx', ['tsx', 'src/db/run-manual-migrations.ts'], migrationEnvironment);

    console.log('\n▶ Re-running manual SQL migrations to prove safe rerun behavior');
    run('npx', ['tsx', 'src/db/run-manual-migrations.ts'], migrationEnvironment);

    await assertSchema(targetUrl.toString());
    console.log('\n✅ Migration safety test passed.');
  } finally {
    const cleanup = postgres(adminUrl.toString(), { max: 1 });
    try {
      await cleanup.unsafe(`DROP DATABASE IF EXISTS "${requestedDatabase}" WITH (FORCE)`);
    } finally {
      await cleanup.end();
    }
  }
}

main().catch((error) => {
  console.error('\n❌ Migration safety test failed.');
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
