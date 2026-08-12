# ADR-003: Split schema source ownership without changing database structure

**Status:** Accepted  
**Date:** 12 August 2026

## Context

`backend/src/db/schema.ts` owns declarations for multiple business contexts. Its size and broad import surface make review difficult, but changing a TypeScript schema file can accidentally produce database migrations if organizational work is conflated with data-model work.

## Decision

Schema declarations will be split by bounded context—such as catalog, orders, customers, content, marketing, and shared primitives—while a compatibility barrel preserves existing imports. This refactoring is source organization only. It must not emit or apply a migration unless a separately approved data-model change exists.

The migration journal and generated migration files remain unchanged during schema modularization. A blank-database migration test and schema snapshot comparison are mandatory before merge.

## Consequences

Database ownership and query imports become easier to understand without changing production tables. The temporary barrel reduces migration disruption, and it can be narrowed only after consumer imports have moved.

## Rejected alternatives

Keeping one schema file indefinitely was rejected because it obscures domain ownership. A simultaneous schema redesign was rejected because it would add data-migration risk to an organizational refactor.
