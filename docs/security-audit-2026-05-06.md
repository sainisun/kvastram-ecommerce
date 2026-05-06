# Kvastram Security Audit

Date: May 6, 2026
Workspace: `E:\Kvastram projects`
Scope: backend, admin, storefront, MCP server, VPS runtime, public domains, dependency posture
Mode: read-only audit, no security fixes applied in this report

## Executive Summary

This audit found multiple serious security issues across the application and live server. The most urgent problems are:

1. public admin self-registration in the backend
2. a publicly reachable MCP OAuth/token flow that can issue a privileged bearer token
3. production secrets committed in the repository
4. weak SSH hardening on the VPS
5. permissive and partially bypassable rate limiting

The system also has privacy, enumeration, SSRF-adjacent, dependency, and browser-hardening gaps that should be addressed in a structured remediation plan.

## Methodology

- reviewed backend, admin, storefront, deploy, and MCP server source
- inspected live VPS configuration over SSH
- verified public domains and headers
- checked route mounting, auth, cookies, rate limiting, uploads, order tracking, and secrets handling
- ran `npm audit --omit=dev --json` across backend, admin, and storefront
- cross-checked findings against current OWASP, OpenSSH, GitHub, and CISA guidance

## Severity Summary

- Critical: 3
- High: 6
- Medium: 4
- Low / informational: several hardening gaps

## Findings

### Critical 1: Public admin self-registration

The backend mounts the admin auth router publicly:

- [backend/src/index.ts](</E:/Kvastram projects/backend/src/index.ts:353>)

That router exposes `POST /auth/register`:

- [backend/src/routes/auth.ts](</E:/Kvastram projects/backend/src/routes/auth.ts:86>)

The registration flow creates a user with admin role:

- [backend/src/services/auth-service.ts](</E:/Kvastram projects/backend/src/services/auth-service.ts:203>)

Impact:

- any internet user could potentially create an admin account
- full admin compromise is possible if this route is reachable in production

Severity: Critical

### Critical 2: Public MCP OAuth/token flow can issue a privileged bearer token

The MCP service has an OAuth-style flow that does not require client authentication:

- `token_endpoint_auth_method: 'none'`
- [kvastram-mcp-server/src/index.ts](</E:/Kvastram projects/kvastram-mcp-server/src/index.ts:95>)

The authorization endpoint auto-approves and redirects any provided `redirect_uri`:

- [kvastram-mcp-server/src/index.ts](</E:/Kvastram projects/kvastram-mcp-server/src/index.ts:101>)

The token endpoint returns the static production secret as the access token:

- [kvastram-mcp-server/src/index.ts](</E:/Kvastram projects/kvastram-mcp-server/src/index.ts:127>)

That same secret protects MCP requests:

- [kvastram-mcp-server/src/index.ts](</E:/Kvastram projects/kvastram-mcp-server/src/index.ts:164>)

The MCP client then uses production admin credentials to obtain backend admin access:

- [kvastram-mcp-server/src/client.ts](</E:/Kvastram projects/kvastram-mcp-server/src/client.ts:13>)

Live check:

- `https://mcp.kvastram.com/health` was publicly reachable and returned `200 OK`

Impact:

- unauthenticated token issuance path
- possible privileged tool access
- chained backend admin operations through MCP

Severity: Critical

### Critical 3: Production secrets committed in repository and present on server with weak handling

Tracked production env file exists:

- [kvastram-mcp-server/.env.production](</E:/Kvastram projects/kvastram-mcp-server/.env.production:1>)

This file contains production credentials and tokens, including:

- admin email
- admin password
- MCP secret token

Server inspection also found the active repository remote configured with an embedded GitHub personal access token in `.git/config`. The token value is intentionally omitted from this report.

Impact:

- repo access may expose production secrets
- git history may preserve leaked credentials even after deletion
- credential rotation is required, not just file cleanup

Severity: Critical

### High 1: SSH hardening on VPS is weak

Live `sshd -T` output showed:

- `permitrootlogin yes`
- `passwordauthentication yes`

Additional runtime findings:

- `fail2ban` inactive
- UFW enabled, but SSH is internet-exposed as expected

Impact:

- brute-force risk
- credential stuffing risk
- elevated blast radius because root login is allowed directly

Severity: High

### High 2: Secret files on server are world-readable to local users

Server file permissions showed mode `644` on:

- `/root/kvastram-ecommerce/.git/config`
- `/root/kvastram-ecommerce/.env.hostinger`
- `/root/kvastram-ecommerce/backend/.env.production`
- `/root/kvastram-ecommerce/admin/.env.production`
- `/root/kvastram-ecommerce/storefront/.env.production`
- `/root/kvastram-ecommerce/deploy/hostinger/.env`

Impact:

- any local privileged or mis-scoped process could read secrets
- poor secret hygiene makes later containment harder

Severity: High

### High 3: Rate limits are too permissive for production

Current limiter values:

- auth: `500 / 15 min`
- checkout: `300 / min`
- general: `6000 / min`
- [backend/src/middleware/rate-limiter.ts](</E:/Kvastram projects/backend/src/middleware/rate-limiter.ts:55>)

Mounted middleware:

- [backend/src/index.ts](</E:/Kvastram projects/backend/src/index.ts:280>)

Impact:

- password spraying
- auth brute force
- scraping
- order tracking abuse
- payment and checkout automation

Severity: High

### High 4: Rate limiting and audit IP attribution trust user-controlled forwarding chain

The limiter uses the first `x-forwarded-for` value:

- [backend/src/middleware/rate-limiter.ts](</E:/Kvastram projects/backend/src/middleware/rate-limiter.ts:39>)

Audit logging also trusts forwarded headers:

- [backend/src/middleware/audit.ts](</E:/Kvastram projects/backend/src/middleware/audit.ts:31>)

Nginx forwards:

- `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`

Impact:

- rate-limit bypass by spoofing client IP chains
- incorrect audit evidence

Severity: High

### High 5: Several public store routes are not clearly covered by dedicated rate limiting

Mounted public routes include:

- `/store/orders`
- `/store/cart`
- `/store/back-in-stock`
- `/store/settings`
- `/store/wishlist`
- [backend/src/index.ts](</E:/Kvastram projects/backend/src/index.ts:390>)

But general/public limiter coverage block does not explicitly include several of these store surfaces:

- [backend/src/index.ts](</E:/Kvastram projects/backend/src/index.ts:294>)

Impact:

- inconsistent abuse protection
- weak coverage on customer-facing flows

Severity: High

### High 6: Dependency posture contains known production vulnerabilities

Backend `npm audit --omit=dev --json` reported 7 production vulnerabilities, including high severity issues in:

- `@hono/node-server`
- `hono`
- `drizzle-orm`
- `nodemailer`

Frontend audits reported issues in:

- `next`
- `axios`
- `socket.io-parser`

Relevant resolved versions in lockfiles:

- [backend/package-lock.json](</E:/Kvastram projects/backend/package-lock.json:1148>)
- [backend/package-lock.json](</E:/Kvastram projects/backend/package-lock.json:3072>)
- [backend/package-lock.json](</E:/Kvastram projects/backend/package-lock.json:4125>)
- [storefront/package-lock.json](</E:/Kvastram projects/storefront/package-lock.json:9041>)
- [admin/package-lock.json](</E:/Kvastram projects/admin/package-lock.json:6175>)

Severity: High

### Medium 1: Public order tracking has privacy and enumeration risk

Order tracking uses:

- predictable serial `display_id`
- [backend/src/db/schema.ts](</E:/Kvastram projects/backend/src/db/schema.ts:393>)

Tracking lookup accepts `order_number + email` and returns order/shipping details:

- [backend/src/routes/store/orders.ts](</E:/Kvastram projects/backend/src/routes/store/orders.ts:14>)

Impact:

- predictable user-facing IDs increase enumeration pressure
- no dedicated tracking-specific limiter
- privacy risk if paired with email knowledge or scraping

Severity: Medium

### Medium 2: Remote URL upload flow is SSRF-adjacent and too weakly validated

Remote URL upload route:

- [backend/src/routes/upload.ts](</E:/Kvastram projects/backend/src/routes/upload.ts:108>)

Validation only checks `http/https`:

- [backend/src/routes/upload.ts](</E:/Kvastram projects/backend/src/routes/upload.ts:117>)

URL is passed to Cloudinary upload flow:

- [backend/src/utils/cloudinary.ts](</E:/Kvastram projects/backend/src/utils/cloudinary.ts:116>)

Impact:

- abuse of remote fetch/import
- weak provenance checks
- elevated risk on admin media workflows

Severity: Medium

### Medium 3: Customer auth still leaks state through some responses

Verification status endpoint:

- [backend/src/routes/store/auth.ts](</E:/Kvastram projects/backend/src/routes/store/auth.ts:250>)

If customer not found, returns `404`:

- [backend/src/routes/store/auth.ts](</E:/Kvastram projects/backend/src/routes/store/auth.ts:260>)

Service logic confirms account state:

- [backend/src/services/customer-auth-service.ts](</E:/Kvastram projects/backend/src/services/customer-auth-service.ts:416>)

Impact:

- email/account enumeration
- customer existence inference

Severity: Medium

### Medium 4: Cookie-only auth posture is weakened by bearer-token fallback and legacy token handling

Customer login still returns token in response:

- [backend/src/routes/store/auth.ts](</E:/Kvastram projects/backend/src/routes/store/auth.ts:314>)

Admin middleware accepts either bearer header or cookie:

- [backend/src/middleware/auth.ts](</E:/Kvastram projects/backend/src/middleware/auth.ts:11>)

Admin settings page still references `localStorage.getItem('token')`:

- [admin/src/app/dashboard/settings/page.tsx](</E:/Kvastram projects/admin/src/app/dashboard/settings/page.tsx:378>)

Impact:

- larger session attack surface
- token exposure risk in browser context

Severity: Medium

## Additional Hardening Notes

### Browser and edge header posture is inconsistent

Observed live headers:

- `kvastram.com` lacked visible HSTS in sampled response
- `admin.kvastram.com` returned stronger browser hardening headers
- `api.kvastram.com` returned API-appropriate security headers

This should be standardized at the nginx layer where possible.

### Health endpoint reveals runtime metadata

The API health response includes uptime, memory usage, version, and timestamp:

- [backend/src/index.ts](</E:/Kvastram projects/backend/src/index.ts:237>)

This is useful operationally, but excessive for a public unauthenticated health surface.

### Positive findings

- app containers are bound to localhost on the VPS
- UFW is enabled with inbound defaults denied
- `unattended-upgrades` was enabled and active
- payment webhook routes implement signature verification and idempotency controls:
  - [backend/src/routes/store/payments.ts](</E:/Kvastram projects/backend/src/routes/store/payments.ts:171>)

## Live Environment Snapshot

Verified on May 6, 2026:

- `https://kvastram.com` -> `200 OK`
- `https://admin.kvastram.com` -> `200 OK`
- `https://api.kvastram.com/health` -> `200 OK`
- `https://mcp.kvastram.com/health` -> `200 OK`

Server observations:

- active deploy path: `/root/kvastram-ecommerce`
- nginx reverse proxy healthy
- Docker containers healthy
- active compose file: `/root/kvastram-ecommerce/deploy/hostinger/docker-compose.yml`

## Recommended Priority Order

1. disable public admin registration
2. disable or lock down public MCP token issuance
3. rotate all leaked secrets immediately
4. remove secrets from tracked files and plan for git history cleanup
5. harden SSH: no root login, no password auth, add ban/rate protections
6. redesign rate limiting by endpoint class
7. patch vulnerable dependencies
8. tighten order tracking privacy and abuse controls
9. harden upload/import paths
10. normalize token/session handling and response headers

## Research References

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP REST Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- OpenSSH `sshd_config` reference: https://man.openbsd.org/OpenBSD-current/man5/sshd_config
- GitHub PAT guidance: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

