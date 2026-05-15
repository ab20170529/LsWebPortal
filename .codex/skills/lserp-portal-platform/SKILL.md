---
name: lserp-portal-platform
description: Portal shell, auth bootstrap, system gate, route entry, package-boundary, and durable lesson write-back work for LsERPPortal. Use when editing apps/portal startup, router behavior, platform auth/session flow, product entry points, or after non-trivial Portal work that should be captured in rolling docs and repo-local skill notes.
---

# LsERP Portal Platform

Use this skill when a task touches the Portal mother project's shell, routing, authentication bootstrap, or product boundaries.

## Start Here

1. Read [portal-entrypoints.md](references/portal-entrypoints.md).
2. Inspect `apps/portal/src/main.tsx`.
3. Inspect `apps/portal/src/router.tsx`.
4. Inspect `packages/platform/auth/src/index.tsx`.
5. Inspect `packages/products/project/src/index.tsx` when the task involves the project product.
6. For non-trivial work, skim the latest entries in `docs/rolling/ai-development-log.md` before editing.

## Guardrails

- Keep `LsERPPortal` as the mother project.
- Treat `packages/studio/designer` as a specialized implementation area, not the default starting point for general Portal work.
- Preserve route protocol, exported package interfaces, and runtime entry contracts unless the user explicitly asks for a breaking change.
- Keep shell and cross-cutting platform logic in `packages/platform`.
- Keep product-specific behavior in `packages/products`.
- Treat `LsAITool` as a migration source only; new frontend implementation belongs in `LsERPPortal` or `LumClaw`.
- For Portal/LumClaw login alignment, align the functional contract only: preserve the `__platform__` platform database option, use `/api/auth/login/identity` for platform selection, land on Portal's `/systems` page, let `system-access-page-view.tsx` fetch `/api/auth/business-dbs` inside the existing left-side business-library selector, and keep Portal's own page style.
- After time-consuming work, write confirmed lessons to `docs/rolling/ai-development-log.md` through the `lserp-portal-evolution` skill.

## File Focus

- `apps/portal/src/main.tsx`: provider and bootstrap wiring.
- `apps/portal/src/router.tsx`: route resolution, redirects, system gate, and product selection.
- `packages/platform/auth/src/index.tsx`: session model, bootstrap, storage, and system access.
- `packages/products/project/src/index.tsx`: project workspace entry and permission-aware shell.

## When To Escalate

- If the task is documentation-only, use `lserp-portal-evolution` instead.
- If the task reveals a reusable pitfall, boundary rule, or verification trick, switch to `lserp-portal-evolution` before finishing.
