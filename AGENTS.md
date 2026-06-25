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
