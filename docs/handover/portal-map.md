# Portal Map

## Main Entry Path

- `apps/portal/src/main.tsx` mounts the Portal shell providers and hands control to `PortalRouter`.
- `apps/portal/src/router.tsx` resolves routes, applies auth/system gating, and chooses the active product entry.

## Core Platform Boundaries

- `packages/platform/auth/src/index.tsx` owns the auth session model, bootstrap normalization, login-stage derivation, company session handling, and system access checks.
- `packages/platform/http` and `packages/platform/tokens` support the shell, but they are not the first files to inspect for handover work.

## Product Entry Points

- `packages/products/project/src/index.tsx` is the real project product entry point.
- `packages/products/project/src/project-workspace-config.ts` defines the project workspace registry.
- `packages/products/project/src/project-permissions.ts` defines visibility and access filtering.
- `packages/products/project/src/project-workspace-shell.tsx` renders the project shell.

## Route Surface

- `/` opens the login page.
- `/systems` opens the system gate.
- `/designer` is the canonical designer entry; `/design` is a compatibility redirect path.
- `/erp`, `/project`, `/bi`, and `/bi-display` are product routes.
- `/system-manager` is a special portal administration route.

## Read First When Debugging

1. `apps/portal/src/router.tsx`
2. `packages/platform/auth/src/index.tsx`
3. `packages/products/project/src/index.tsx`

## Do Not Start Here

- `packages/studio/designer` unless the task explicitly targets designer implementation details
- generated build output under `dist`
- the backend project when the task is only about Portal entry or documentation
