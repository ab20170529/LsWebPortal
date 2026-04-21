# Portal Entry Points

Use this reference when a task touches Portal shell startup, auth bootstrap, the system gate, or product routing.

## First Files To Read

1. `apps/portal/src/main.tsx`
2. `apps/portal/src/router.tsx`
3. `packages/platform/auth/src/index.tsx`
4. `packages/products/project/src/index.tsx` when the task involves the project product

## Boundary Rules

- Keep `LsERPPortal` as the mother project.
- Exclude `packages/studio/designer` unless the user explicitly asks for legacy designer details.
- Preserve route protocol, product package exports, and shell entry contracts unless the user asks to change them.
- Keep shell-wide logic in `packages/platform`; keep product-specific behavior in `packages/products`.

## Route Helpers

- `/design` should be treated as compatibility input for `/designer`.
- `SystemAccessPage` is the system-gate handoff after auth.
- `ProjectHomePage` is the product entry for `/project`.
- `BiHomePage` and `ErpHomePage` are product entries reached through the Portal router.
