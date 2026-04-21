# Project Domain Map

The project product lives under `packages/products/project`.
Treat this package as the project-workspace owner inside Portal, not as a loose page collection.

## Read Order

1. `src/index.tsx`
2. `src/project-workspace-config.ts`
3. `src/project-permissions.ts`
4. `src/project-workspace-shell.tsx`
5. The specific workspace page or feature file involved in the change

## Domain Areas

- `src/project-workspace-config.ts` registers workspace ids, groups, and labels.
- `src/project-permissions.ts` decides what the current session can see or edit.
- `src/project-workspace-shell.tsx` owns the project shell layout and workspace switching.
- `src/project-management-page.tsx` is the main project list and detail surface.
- `src/project-role-permission-management-page.tsx` and `src/project-user-permission-management-page.tsx` cover permission management surfaces.
- `src/workspaces/` contains the specialized workspaces such as delay application, plan log, and task submission.

## Session Dependencies

The project product depends on the Portal auth session for:

- current employee identity
- company/account-set context
- super-admin flags and visible workspace ids

If the project screen behaves strangely, confirm the Portal session and company gate first, then inspect the project package.

## Boundary Rule

Keep project-specific behavior inside `packages/products/project`.
If a change reaches the shell or cross-product routing layer, move up to `apps/portal/src/router.tsx` and stop before crossing into legacy designer code.
