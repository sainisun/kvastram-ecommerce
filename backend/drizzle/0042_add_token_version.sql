ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "token_version" integer NOT NULL DEFAULT 1;

ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "token_version" integer NOT NULL DEFAULT 1;
