# ADR-002: Preserve public API behavior while introducing explicit contract types

**Status:** Accepted  
**Date:** 12 August 2026

## Context

The storefront and admin applications use large local API client modules, while backend routes and services expose behavior that must remain compatible during refactoring. Reusing database row types or server service types directly in clients would make internal changes externally expensive.

## Decision

The system will introduce explicit TypeScript contract types for stable boundaries, starting with identifiers, pagination, errors, money, order state, and catalog read models. These types are framework-free and must not expose Drizzle table types or provider SDK types.

Refactoring preserves current endpoint paths, status codes, response fields, cookies, query parameters, and page URLs. Existing client modules remain compatibility facades while feature-specific clients are introduced incrementally. A behavior change requires a separate approved change and contract test update.

## Consequences

Backend internals can be decomposed without requiring simultaneous client rewrites. Contract types create a deliberate migration seam but do not automatically create a published package or a versioned public API. DTO validation and versioning remain later workstream responsibilities.

## Rejected alternatives

A shared package was not created immediately because no stable package publication, ownership, or versioning model has been established. Directly exporting server internals was rejected because it would couple clients to database and implementation details.
