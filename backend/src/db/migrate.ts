import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("⏳ Start migrating...");

  // Connection for migration
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("✅ Migrations completed successfully!");

  await migrationClient.end();
}

runMigration().catch((err) => {
  console.error("❌ Migration failed!");
  console.error(err);
  process.exit(1);
});
