---
name: lserp-portal-platform
description: Portal shell, auth bootstrap, system gate, route entry, and package-boundary work for LsERPPortal. Use when editing apps/portal startup, router behavior, platform auth/session flow, or project-first entry points, and only dive into designer implementation details when the task explicitly targets that area.
---

# LsERP Portal Platform

Use this skill when a task touches the Portal mother project's shell, routing, authentication bootstrap, or product boundaries.

## Start Here

1. Read [portal-entrypoints.md](references/portal-entrypoints.md).
2. Inspect `apps/portal/src/main.tsx`.
3. Inspect `apps/portal/src/router.tsx`.
4. Inspect `packages/platform/auth/src/index.tsx`.
5. Inspect `packages/products/project/src/index.tsx` when the task involves the project product.

## Guardrails

- Keep `LsERPPortal` as the mother project.
- Treat `packages/studio/designer` as a specialized implementation area, not the default starting point for general Portal work.
- Preserve route protocol, exported package interfaces, and runtime entry contracts unless the user explicitly asks for a breaking change.
- Keep shell and cross-cutting platform logic in `packages/platform`.
- Keep product-specific behavior in `packages/products`.

## File Focus

- `apps/portal/src/main.tsx`: provider and bootstrap wiring.
- `apps/portal/src/router.tsx`: route resolution, redirects, system gate, and product selection.
- `packages/platform/auth/src/index.tsx`: session model, bootstrap, storage, and system access.
- `packages/products/project/src/index.tsx`: project workspace entry and permission-aware shell.

## When To Escalate

- If the task is documentation-only, use `lserp-portal-evolution` instead.
