# Kvastram Repository, Deployment, and Design-System Hardening Plan

Status: Implemented locally; production publication pending
Date: 2026-06-20
Canonical repository: `https://github.com/sainisun/kvastram-ecommerce`
Canonical production checkout: `/root/kvastram-ecommerce`

## Objective

Prevent stale branches, alternate worktrees, old VPS checkouts, CSS ownership drift, CMS content mistakes, or AI-assisted edits from silently replacing the approved storefront.

## Phase 1: Repository And AI Workflow

- Add root `AGENTS.md` with mandatory branch, verification, and deployment rules.
- Add CODEOWNERS and a pull-request checklist.
- Add a repository-state script that detects stale base branches, dirty tracked files, and unexpected worktrees.
- Preserve existing user files; classify them separately instead of deleting them automatically.

## Phase 2: CI And Deployment

- Add a required storefront quality workflow:
  - design-system audit
  - metrics
  - lint
  - unit tests
  - production build
  - Playwright desktop/mobile smoke tests
- Make production deployment depend on the quality workflow.
- Add deployment concurrency so two production deployments cannot overlap.
- Verify the absolute VPS repository path before running Docker Compose.
- Use an explicit production Compose project name.
- Pass the Git commit SHA into storefront, admin, and backend containers.
- Expose deployed SHA in health endpoints.
- Verify repository SHA, container SHA, and health SHA after deployment.
- Remove the stale MCP service definition or restore its missing source before it can affect deploy status.

## Phase 3: Design-System Truth

- Align the active design-system documentation with runtime typography.
- Keep `tokens.css` as the runtime source of truth.
- Document one typography contract, one accent contract, and one component ownership model.
- Add automated checks for documentation/runtime token drift.

## Phase 4: CSS Ownership

- Generate a selector ownership report.
- Fail CI when a new selector gains an unapproved second owner.
- Maintain a small allowlist for intentional layout/typography cooperation.
- Gradually consolidate broad override files into feature owners.

## Phase 5: CMS Visual Guardrails

- Hide empty homepage sections instead of rendering admin instructions publicly.
- Validate hero desktop/mobile media and CTA destinations.
- Add editorial guidance against text baked into hero images when HTML copy is enabled.
- Require preview-ready content before publishing.

## Phase 6: Visual Regression

- Add Playwright desktop and mobile projects.
- Verify homepage hero, navigation, primary CTA, category discovery, and absence of public admin placeholders.
- Save failure screenshots as CI artifacts.
- Add stable screenshot baselines after CMS content is approved.

## Completion Criteria

- GitHub `main`, canonical VPS checkout, container labels, and health SHA match.
- Production can only deploy from the canonical workflow and checkout.
- Old VPS checkout cannot run Compose.
- Repository workflow rules are visible to every AI agent.
- Design-system documentation matches runtime tokens.
- New duplicate CSS ownership fails CI.
- Desktop/mobile visual smoke tests pass.
- Storefront audit, lint, unit tests, and production build pass.

## Execution Record

- Repository and AI rules, CODEOWNERS, and PR checklist added.
- Repository ancestry/worktree/dirty-state guard added.
- Storefront quality workflow and production deploy quality gate added.
- Canonical VPS path, clean checkout, deployed Git SHA, and health SHA checks added.
- MCP deployment isolated behind an explicit profile and source/secret checks.
- Runtime typography and active documentation aligned.
- Design-system audit now fails on typography contract drift.
- CSS duplicate ownership baseline and no-growth ratchet added.
- Hero publishing validates complete HTML copy and safe CTA destinations.
- Playwright desktop/mobile projects and visual smoke assertions added.
- Local audits, unit tests, storefront build, admin build, and backend build passed on 2026-06-20.
- Live desktop smoke tests passed; live mobile smoke tests passed after correcting the mobile navigation assertion.
- Docker Compose validation remains a VPS/CI gate because Docker is not installed in the local Windows workspace.
