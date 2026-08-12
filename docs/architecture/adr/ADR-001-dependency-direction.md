# ADR-001: Enforce inward dependency direction and framework-free core modules

**Status:** Accepted  
**Date:** 12 August 2026

## Context

Critical backend workflows currently combine HTTP handling, data access, provider integration, validation, and business policy in broad files. This raises change risk because framework and infrastructure dependencies leak into code that should be independently testable.

## Decision

The refactoring program adopts an inward dependency direction. New core code is organized under `backend/src/contracts`, `backend/src/domain`, and `backend/src/application`.

`contracts` contains framework-free TypeScript types. `domain` contains pure policies, value types, and state transitions. `application` contains use cases that depend on domain behavior and port interfaces. Hono routes, Drizzle repositories, payment providers, carrier providers, and external messaging services remain outer adapters.

## Consequences

New code gains focused unit-test seams and can be moved without changing HTTP or database behavior. Existing files are not required to be rewritten immediately; compatibility facades are acceptable during migration. The architecture checker blocks prohibited framework/infrastructure imports from the new core folders.

## Rejected alternatives

A full clean-architecture rewrite was rejected because it would combine too many behavior changes with structural work. A convention-only approach was rejected because it would not prevent new boundary violations.
