# LsERPPortal Agent Entry

This repo-local entry applies only to `D:\NetPorjects\JavaProject\LserpPro\LserpPlat\LsERPPortal`.
Do not edit the workspace root or backend projects from this entry.

## Start Here

1. Read `docs/handover/README.md`.
2. Open `apps/portal/src/main.tsx`.
3. Open `apps/portal/src/router.tsx`.
4. Open `packages/platform/auth/src/index.tsx`.
5. Open `packages/products/project/src/index.tsx` when the task touches the project product.

## Working Rules

- Keep `LsERPPortal` as the mother project.
- Treat `packages/studio/designer` as a specialized implementation area, not the default starting point for general Portal work.
- Preserve route protocol, exported package interfaces, and runtime entry contracts unless the user explicitly asks for a breaking change.
- Keep shell and cross-cutting platform logic in `packages/platform`.
- Keep product-specific behavior in `packages/products`.
- Use `pwsh` for shell work on this machine.

## When To Use The Repo Skills

- Use `.codex/skills/lserp-portal-platform` for shell boot, auth bootstrap, system gate, routes, package boundaries, and project-first entry points.
- Use `.codex/skills/lserp-portal-evolution` for stable handover docs, map files, README links, and other durable write-backs.
