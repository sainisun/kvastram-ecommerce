# Odhvica Engineering Rules

These rules apply to humans and AI agents working in this repository.

## Canonical Sources

- GitHub source of truth: `origin/main`
- Production checkout: `/root/odhvica-ecommerce`
- Storefront tokens: `storefront/src/styles/tokens.css`
- Storefront design-system specification: `docs/design-system/storefront-design-system-v1.md`
- Production deployment workflow: `.github/workflows/deploy-hostinger.yml`

## Before Editing

1. Run `git fetch origin main`.
2. Confirm the work starts from `origin/main`.
3. Use a fresh feature branch, or push directly to `main` for rapid UI/design iteration.
4. Inspect `git status --short` and preserve unrelated user changes.
5. Do not use an old worktree as a deployment source.
6. Run `npm run setup:repository` once per clone to activate shared Git hooks.

## Storefront Rules

- Use `--ds-*` tokens and shared primitives.
- Do not create broad CSS overrides or a second owner for an existing selector.
- Do not change typography or palette tokens without updating the active design-system specification.
- Empty CMS sections must render nothing, never public admin instructions.
- Hero images should not contain baked-in copy when HTML hero copy is enabled.

## Required Verification

For storefront changes run:

```text
npm.cmd run audit:design-system
npm.cmd run audit:design-system:metrics
npm.cmd run lint
npm.cmd run verify:design-system -- --pool=threads
npm.cmd run build
```

Run Playwright desktop/mobile smoke tests for visual or layout changes.

## Publishing

- Do not deploy with a manual `docker compose up` command.
- Do not deploy from any path except `/root/odhvica-ecommerce`.
- Production deploys only through `.github/workflows/deploy-hostinger.yml`.
- Verify the deployed Git SHA through `/health` after deployment.

## Prohibited

- Resetting or deleting unrelated user work
- Deploying from `/root/odhvica-platform` or any alternate checkout
- Running multiple Compose projects against the same production ports
- Silently changing the design-system typography or accent contract

## Deployment workflow — MANDATORY, no exceptions

This project deploys via GitHub Actions CI/CD. The correct and ONLY workflow is:

1. Make code changes locally.
2. Test locally (and in a local Docker build if relevant).
3. Commit and push to the `main` branch on GitHub.
4. The GitHub Actions workflow automatically builds and deploys to the VPS.

NEVER SSH directly into the VPS to:
- Manually run `docker compose up --build`, `docker compose restart`, or any 
  deployment command.
- Manually edit files, environment variables, or configs on the server.
- Manually tag/swap Docker images as a "fix."

If production is broken and needs an emergency rollback, the correct action is to 
revert the problematic commit(s) on GitHub and let the CI/CD pipeline redeploy the 
reverted code — not to manually intervene on the VPS. Manual VPS changes create 
drift between what's in GitHub and what's actually running, which is exactly what 
caused confusion in this incident (the running production code no longer matched 
any commit in git history).

If manual VPS access is absolutely unavoidable (e.g. reading logs for debugging), 
it must be read-only investigation only — no state-changing commands — and must be 
reported back before any follow-up action is taken.
