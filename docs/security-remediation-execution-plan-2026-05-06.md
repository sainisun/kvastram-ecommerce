# Kvastram Security Remediation Execution Plan

Date: May 6, 2026
Input: [Security Audit Report](</E:/Kvastram projects/docs/security-audit-2026-05-06.md>)
Goal: fix the identified security issues in a safe, staged, testable order

## Planning Principles

- stop active exposure before broad refactors
- rotate secrets before assuming any old secret is safe
- keep production stable by separating emergency containment from code cleanup
- favor reversible rollout steps where possible
- verify each phase before moving to the next

## Phase 0: Emergency Containment

Target window: same day
Owner tracks: backend, infra, repo/security

### 0.1 Disable public admin registration

Actions:

- remove or hard-block `POST /auth/register` in production
- if admin bootstrap is still needed, allow it only through one of:
  - local-only script
  - migration/bootstrap CLI
  - invite token with strict allowlist and expiry

Verification:

- `POST /auth/register` returns `403` or `404`
- existing admin login still works

### 0.2 Disable public MCP token issuance

Actions:

- immediately take one of these approaches:
  - best: disable public `/authorize` and `/token`
  - acceptable interim: restrict MCP at nginx with allowlist/basic auth/VPN
  - also acceptable interim: stop exposing `mcp.kvastram.com` publicly

Verification:

- unauthenticated requests cannot obtain MCP bearer token
- intended internal workflows still work from approved channel

### 0.3 Rotate all exposed secrets

Must rotate:

- GitHub PAT embedded in server repo remote
- MCP secret token
- MCP admin password
- any other credentials stored in tracked env files
- review backend/admin/storefront env values for rotation candidates

Important:

- rotate first, then clean files
- assume git history preserved previous values

Verification:

- old secrets no longer work
- deployments and apps still boot with new secrets

### 0.4 Tighten server secret permissions

Actions:

- change secret-bearing files from `644` to `600`
- ensure owner remains `root`
- confirm containers still read expected env files

Verification:

- `stat` reflects tightened permissions
- app restart successful

## Phase 1: Access Control and Auth Fixes

Target window: 1-2 days

### 1.1 Remove dual-use public admin auth risk

Implementation tasks:

- split admin bootstrap from public auth router
- keep only admin login/logout/profile routes public as needed
- ensure no route can create admin users without prior trusted admin context

Files likely involved:

- `backend/src/index.ts`
- `backend/src/routes/auth.ts`
- `backend/src/services/auth-service.ts`
- any setup/reset scripts

Tests:

- admin login success
- non-admin registration impossible
- unauthorized admin creation blocked

### 1.2 Normalize session model

Implementation tasks:

- move toward cookie-first auth for browser clients
- remove legacy token return from customer login if no longer needed
- remove stale `localStorage.getItem('token')` admin usage
- review middleware that accepts bearer + cookie and decide intended policy

Files likely involved:

- `backend/src/routes/store/auth.ts`
- `backend/src/middleware/auth.ts`
- `admin/src/app/dashboard/settings/page.tsx`
- related frontend API clients

Tests:

- admin flows work without localStorage token
- customer login/logout/session refresh still works
- CSRF-sensitive routes continue to function

### 1.3 Reduce auth enumeration leaks

Implementation tasks:

- make `verification-status` generic or authenticated-only
- normalize registration/login/account-state messages
- preserve usability where necessary but avoid existence leaks

Tests:

- same outward response shape for existent/non-existent emails where appropriate

## Phase 2: MCP Service Redesign

Target window: 2-4 days

### 2.1 Decide intended MCP trust model

Decision needed:

- internal-only tool
- VPN-only tool
- authenticated external tool with proper client trust

Recommendation:

- make MCP internal-only unless there is a strong business need for public access

### 2.2 Replace static secret issuance flow

Implementation tasks:

- remove token endpoint behavior that returns a static shared secret
- bind clients to an approved redirect URI allowlist
- require real client authentication or move behind a private network boundary
- stop using production admin password as the operational bridge if avoidable

### 2.3 Separate MCP privilege from full admin credential

Implementation tasks:

- create scoped service account / service token pattern
- ensure least privilege for tool operations
- audit every MCP tool for allowed backend actions

Tests:

- unauthorized client cannot complete auth flow
- authorized client gets only expected capabilities

## Phase 3: Rate Limiting and Abuse Prevention

Target window: 2-3 days

### 3.1 Redesign limits by endpoint class

Recommended model:

- auth login/register/reset: strict
- contact/newsletter/inquiry forms: strict
- order tracking: strict
- checkout/payment creation: very strict
- catalog browsing/search: moderate
- admin authenticated APIs: moderate but not excessive

### 3.2 Fix trusted client IP derivation

Implementation tasks:

- trust proxy only from nginx boundary
- derive client IP from a trusted chain, not arbitrary first XFF value
- reuse same logic in rate limiter and audit logging

### 3.3 Add dedicated coverage for omitted store routes

Likely routes:

- `/store/orders/*`
- `/store/cart/*`
- `/store/back-in-stock/*`
- `/store/settings/*`
- `/store/wishlist/*`

Tests:

- repeated requests trigger `429`
- admin/internal flows unaffected

## Phase 4: Tracking Privacy and Public Endpoint Hardening

Target window: 1-2 days

### 4.1 Harden order tracking

Implementation options:

- add dedicated rate limit
- add short-term challenge or temporary block after repeated failures
- use high-entropy tracking token instead of predictable serial-only lookup
- reduce public data returned to the minimum necessary

### 4.2 Trim public health output

Implementation tasks:

- public `/health` returns only status and maybe timestamp
- move detailed health info to private/admin-only monitor endpoint

## Phase 5: Upload and Input Hardening

Target window: 1-2 days

### 5.1 Harden remote URL upload

Implementation tasks:

- remove `/upload/from-url` if unnecessary
- otherwise restrict to allowlisted domains/providers
- block private, loopback, link-local, metadata, and internal address targets
- validate content type and size before import where feasible

### 5.2 Review all external fetch flows

Targets:

- social auth verification calls
- payment/provider callbacks
- media import paths
- MCP helper fetches

## Phase 6: Dependency Upgrades

Target window: 2-4 days

### 6.1 Backend dependency patch pass

Priority packages:

- `@hono/node-server`
- `hono`
- `drizzle-orm`
- `nodemailer`

### 6.2 Frontend dependency patch pass

Priority packages:

- `next`
- `axios`
- `socket.io-parser`

### 6.3 Upgrade verification

- build backend/admin/storefront
- run focused auth/order/payment smoke tests
- verify no middleware or routing regressions after Hono/Next updates

## Phase 7: Server and Edge Hardening

Target window: 1-2 days

### 7.1 SSH hardening

Actions:

- create and verify non-root sudo admin
- set `PermitRootLogin no` or at minimum `prohibit-password`
- set `PasswordAuthentication no`
- verify key-based login in a second session before reload
- install and configure `fail2ban`

### 7.2 Nginx header normalization

Actions:

- standardize HSTS where appropriate
- review CSP strategy for storefront/admin
- ensure public apps receive consistent core headers

### 7.3 Logging and alerting

Actions:

- alert on repeated auth failures
- alert on rate-limit spikes
- alert on MCP auth attempts if MCP remains exposed

## Phase 8: Secrets Governance

Target window: parallel after rotation

### 8.1 Remove tracked secret files from source control

Actions:

- replace tracked production env files with examples only
- move runtime secrets to server-only or secret-manager-backed injection

### 8.2 Decide git-history cleanup scope

Options:

- minimal: rotate secrets and prevent future commits
- stronger: rewrite history for known secret-bearing files

### 8.3 Add guardrails

Actions:

- secret scanning in CI
- pre-commit hooks or push protection
- documented secret handling policy

## Suggested Execution Order

1. Phase 0 emergency containment
2. Phase 1 access control and auth fixes
3. Phase 2 MCP redesign
4. Phase 3 rate limiting and abuse prevention
5. Phase 4 tracking/privacy hardening
6. Phase 5 upload/input hardening
7. Phase 6 dependency upgrades
8. Phase 7 server/edge hardening
9. Phase 8 secrets governance

## Verification Checklist

- public admin registration blocked
- MCP public token path blocked or privatized
- all exposed secrets rotated
- old secrets invalid
- server boots with new secrets
- SSH root/password auth disabled safely
- rate limits return `429` under abuse scenarios
- tracking endpoint abuse reduced
- remote upload path constrained or removed
- backend/admin/storefront builds pass
- smoke test on login, checkout, orders, returns, admin dashboard passes

## Recommended Work Split

- Backend: auth, rate limiting, tracking, upload, health endpoint
- Frontend admin: legacy token removal, admin auth verification
- Frontend storefront: customer auth/session cleanup, tracking UX adjustments
- Infra: nginx, SSH, fail2ban, secret permissions, secret rotation
- Repo/security: history review, secret scanning, documentation

## Deliverables for Execution

- code fixes by phase
- rotated credential inventory
- server hardening checklist completion
- dependency upgrade matrix
- post-remediation verification report

